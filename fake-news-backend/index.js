const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env' });

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL, 'http://localhost:3000']
        : true,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));


const { db, query } = require('./connection');

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadsDir),
        filename: (_req, file, cb) => {
            const safeBase = path
                .basename(file.originalname, path.extname(file.originalname))
                .replace(/[^a-zA-Z0-9-_]/g, '_');
            cb(null, `${Date.now()}-${safeBase}${path.extname(file.originalname).toLowerCase()}`);
        },
    }),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/pdf',
            'video/mp4',
        ];
        cb(null, allowed.includes(file.mimetype));
    },
});

app.get('/', (_req, res) => {
    res.json({
        service: 'Rumor Verification API',
        version: '2.0.0',
        routes: {
            reports: '/api/reports',
            review: '/api/review/reports',
            search: '/api/search?q=...',
            dashboard: '/api/dashboard/stats',
            articles: '/api/articles',
            sources: '/api/sources',
        },
    });
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'name, email, password are required' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const rows = await query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, hashed, 'user']
        );

        return res.status(201).json({ message: 'user created', userId: rows.insertId });
    } catch (error) {
        if (error?.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'email already exists' });
        }
        return res.status(500).json({ error: 'failed to register', details: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        const users = await query('SELECT user_id, name, email, role, password_hash FROM users WHERE email = ?', [email]);
        if (!users.length) {
            return res.status(401).json({ error: 'invalid credentials' });
        }

        const user = users[0];
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
            return res.status(401).json({ error: 'invalid credentials' });
        }

        return res.json({
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        return res.status(500).json({ error: 'failed to login', details: error.message });
    }
});

app.post('/api/reports', upload.array('evidence', 5), async (req, res) => {
    try {
        const { userId = null, title, description, sourceUrl = null, category = 'general', tags = '' } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: 'title and description are required' });
        }

        const reportInsert = await query(
            `INSERT INTO reports (user_id, title, description, source_url, category, tags, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [userId, title, description, sourceUrl, category, tags]
        );

        const reportId = reportInsert.insertId;
        const files = req.files || [];
        for (const file of files) {
            await query(
                `INSERT INTO report_evidence (report_id, file_name, file_path, mime_type, file_size)
                 VALUES (?, ?, ?, ?, ?)`,
                [reportId, file.filename, `/uploads/${file.filename}`, file.mimetype, file.size]
            );
        }

        return res.status(201).json({
            message: 'report submitted',
            reportId,
            evidenceCount: files.length,
        });
    } catch (error) {
        return res.status(500).json({ error: 'failed to submit report', details: error.message });
    }
});

app.get('/api/reports', async (req, res) => {
    try {
        const { status, category, q, tag, userId, limit = 20 } = req.query;
        const where = [];
        const values = [];

        if (status) {
            where.push('r.status = ?');
            values.push(status);
        }
        if (category) {
            where.push('r.category = ?');
            values.push(category);
        }
        if (q) {
            where.push('(r.title LIKE ? OR r.description LIKE ?)');
            values.push(`%${q}%`, `%${q}%`);
        }
        if (tag) {
            where.push('r.tags LIKE ?');
            values.push(`%${tag}%`);
        }
        if (userId) {
            where.push('r.user_id = ?');
            values.push(Number(userId));
        }

        const sql = `
            SELECT r.*, u.name AS reporter_name
            FROM reports r
            LEFT JOIN users u ON u.user_id = r.user_id
            ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
            ORDER BY r.created_at DESC
            LIMIT ?
        `;

        values.push(Number(limit) || 20);
        const reports = await query(sql, values);
        return res.json({ count: reports.length, reports });
    } catch (error) {
        return res.status(500).json({ error: 'failed to load reports', details: error.message });
    }
});

app.get('/api/reports/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await query('SELECT * FROM reports WHERE report_id = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'report not found' });
        }

        const evidence = await query('SELECT * FROM report_evidence WHERE report_id = ?', [id]);
        const verification = await query('SELECT * FROM verifications WHERE report_id = ? ORDER BY verified_at DESC LIMIT 1', [id]);

        return res.json({ report: rows[0], evidence, verification: verification[0] || null });
    } catch (error) {
        return res.status(500).json({ error: 'failed to load report', details: error.message });
    }
});

app.get('/api/review/reports', async (_req, res) => {
    try {
        const rows = await query(
            `SELECT report_id, title, description, status, category, created_at
             FROM reports
             ORDER BY created_at DESC`
        );
        return res.json({ reports: rows });
    } catch (error) {
        return res.status(500).json({ error: 'failed to load review queue', details: error.message });
    }
});

app.put('/api/reports/:id/verification', async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewerId = null, verdict, reason = '', sourceId = null } = req.body;
        const normalizedVerdict = String(verdict || '').toLowerCase();

        if (!['true', 'false'].includes(normalizedVerdict)) {
            return res.status(400).json({ error: 'verdict must be true or false' });
        }

        const reportRows = await query('SELECT report_id FROM reports WHERE report_id = ?', [id]);
        if (!reportRows.length) {
            return res.status(404).json({ error: 'report not found' });
        }

        await query('UPDATE reports SET status = ?, admin_notes = ? WHERE report_id = ?', [normalizedVerdict, reason, id]);
        await query(
            `INSERT INTO verifications (report_id, reviewer_id, verdict, reason, source_id)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                reviewer_id = VALUES(reviewer_id),
                verdict = VALUES(verdict),
                reason = VALUES(reason),
                source_id = VALUES(source_id),
                verified_at = CURRENT_TIMESTAMP`,
            [id, reviewerId, normalizedVerdict, reason, sourceId]
        );

        return res.json({ message: 'verification saved', reportId: Number(id), verdict: normalizedVerdict });
    } catch (error) {
        return res.status(500).json({ error: 'failed to verify report', details: error.message });
    }
});

app.post('/api/articles', async (req, res) => {
    try {
        const { title, content, category = 'awareness', tags = '', createdBy = null, isPublished = 1 } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: 'title and content are required' });
        }

        const insert = await query(
            `INSERT INTO articles (title, content, category, tags, created_by, is_published)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, content, category, tags, createdBy, isPublished ? 1 : 0]
        );

        return res.status(201).json({ message: 'article created', articleId: insert.insertId });
    } catch (error) {
        return res.status(500).json({ error: 'failed to create article', details: error.message });
    }
});

app.get('/api/articles', async (req, res) => {
    try {
        const { q, tag, limit = 20 } = req.query;
        const where = ['is_published = 1'];
        const values = [];

        if (q) {
            where.push('(title LIKE ? OR content LIKE ?)');
            values.push(`%${q}%`, `%${q}%`);
        }
        if (tag) {
            where.push('tags LIKE ?');
            values.push(`%${tag}%`);
        }

        values.push(Number(limit) || 20);
        const rows = await query(
            `SELECT article_id, title, content, category, tags, created_at
             FROM articles
             WHERE ${where.join(' AND ')}
             ORDER BY created_at DESC
             LIMIT ?`,
            values
        );

        return res.json({ count: rows.length, articles: rows });
    } catch (error) {
        return res.status(500).json({ error: 'failed to load articles', details: error.message });
    }
});

app.post('/api/sources', async (req, res) => {
    try {
        const { sourceName, sourceUrl, credibilityScore = 50, notes = '' } = req.body;
        if (!sourceName || !sourceUrl) {
            return res.status(400).json({ error: 'sourceName and sourceUrl are required' });
        }

        const insert = await query(
            'INSERT INTO sources (source_name, source_url, credibility_score, notes) VALUES (?, ?, ?, ?)',
            [sourceName, sourceUrl, Number(credibilityScore) || 50, notes]
        );

        return res.status(201).json({ message: 'source created', sourceId: insert.insertId });
    } catch (error) {
        return res.status(500).json({ error: 'failed to create source', details: error.message });
    }
});

app.get('/api/sources', async (_req, res) => {
    try {
        const rows = await query('SELECT * FROM sources ORDER BY credibility_score DESC, source_name ASC');
        return res.json({ count: rows.length, sources: rows });
    } catch (error) {
        return res.status(500).json({ error: 'failed to load sources', details: error.message });
    }
});

app.get('/api/search', async (req, res) => {
    try {
        const { q = '' } = req.query;
        if (!q.trim()) {
            return res.status(400).json({ error: 'query q is required' });
        }
        const term = `%${q}%`;

        const results = await query(
            `
            (SELECT 'report' AS type, report_id AS id, title, description AS body, created_at
             FROM reports
             WHERE title LIKE ? OR description LIKE ? OR tags LIKE ?)
            UNION ALL
            (SELECT 'article' AS type, article_id AS id, title, content AS body, created_at
             FROM articles
             WHERE is_published = 1 AND (title LIKE ? OR content LIKE ? OR tags LIKE ?))
            ORDER BY created_at DESC
            LIMIT 50
            `,
            [term, term, term, term, term, term]
        );

        return res.json({ count: results.length, results });
    } catch (error) {
        return res.status(500).json({ error: 'failed to search', details: error.message });
    }
});

app.get('/api/dashboard/stats', async (_req, res) => {
    try {
        const [totalReports] = await query('SELECT COUNT(*) AS value FROM reports');
        const [pendingReports] = await query(`SELECT COUNT(*) AS value FROM reports WHERE status = 'pending'`);
        const [trueReports] = await query(`SELECT COUNT(*) AS value FROM reports WHERE status = 'true'`);
        const [falseReports] = await query(`SELECT COUNT(*) AS value FROM reports WHERE status = 'false'`);
        const [totalArticles] = await query('SELECT COUNT(*) AS value FROM articles WHERE is_published = 1');
        const [totalSources] = await query('SELECT COUNT(*) AS value FROM sources');
        const categoryStats = await query(
            `SELECT category, COUNT(*) AS count
             FROM reports
             GROUP BY category
             ORDER BY count DESC
             LIMIT 8`
        );
        const topTags = await query(
            `SELECT tags
             FROM reports
             WHERE tags IS NOT NULL AND tags <> ''
             ORDER BY created_at DESC
             LIMIT 100`
        );

        const tagCounter = {};
        const sanitizeTag = (rawTag) => {
            const normalized = String(rawTag || '').trim();
            if (!normalized) return '';
            if (normalized.includes('�') || normalized.includes('?')) return '';
            return normalized;
        };
        topTags.forEach((row) => {
            row.tags
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean)
                .forEach((tag) => {
                    const cleanTag = sanitizeTag(tag);
                    if (!cleanTag) return;
                    tagCounter[cleanTag] = (tagCounter[cleanTag] || 0) + 1;
                });
        });

        const topTagsList = Object.entries(tagCounter)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([tag, count]) => ({ tag, count }));

        return res.json({
            totalReports: totalReports.value,
            pendingReports: pendingReports.value,
            trueReports: trueReports.value,
            falseReports: falseReports.value,
            totalArticles: totalArticles.value,
            totalSources: totalSources.value,
            categoryStats,
            topTags: topTagsList,
        });
    } catch (error) {
        return res.status(500).json({ error: 'failed to load dashboard', details: error.message });
    }
});

app.post('/api/verify-ai', async (req, res) => {
    const { text = '', sourceUrl = '' } = req.body;
    if (!text.trim()) return res.status(400).json({ error: 'النص مطلوب' });

    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (GEMINI_KEY) {
        try {
            const prompt = `أنت محلل أخبار متخصص في كشف الشائعات والأخبار المضللة.
حلل هذا الخبر: "${text.substring(0, 1000)}"
${sourceUrl ? `المصدر: ${sourceUrl}` : ''}

أجب بـ JSON فقط بهذا الشكل بدون أي نص إضافي:
{"confidence": <رقم 0-100 نسبة الموثوقية>, "verdict": "<true|false|uncertain>", "summary": "<تحليل مختصر بالعربية في جملة أو جملتين>", "reasons": ["سبب1", "سبب2"]}

true = موثوق، false = مضلل، uncertain = يحتاج تحقق`;

            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const geminiData = await geminiRes.json();
            const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return res.json({ confidence: result.confidence || 50, verdict: result.verdict || 'uncertain', summary: result.summary || 'لم يتمكن النظام من التحليل', reasons: result.reasons || [], powered_by: 'gemini' });
            }
        } catch (err) {
            console.error('Gemini verify error:', err.message);
        }
    }

    // Fallback analysis
    const lowered = text.toLowerCase();
    const suspiciousPatterns = ['عاجل جدا', 'غير قابل للتصديق', 'شارك الآن', 'ارسلها لكل الناس', 'سيصيبك'];
    const penalty = suspiciousPatterns.reduce((sum, p) => (lowered.includes(p) ? sum + 18 : sum), 0);
    let sourceScore = 55;
    if (sourceUrl.includes('.gov') || sourceUrl.includes('.edu')) sourceScore += 25;
    if (sourceUrl.includes('.tk') || sourceUrl.includes('.xyz')) sourceScore -= 25;
    const confidence = Math.max(5, Math.min(95, sourceScore - penalty));
    const verdict = confidence >= 65 ? 'true' : confidence <= 35 ? 'false' : 'uncertain';
    return res.json({ confidence, verdict, summary: verdict === 'true' ? 'الخبر يبدو مقبولاً مبدئياً، لكن يفضل المراجعة البشرية.' : verdict === 'false' ? 'الخبر عالي الخطورة ويحتاج تحققاً بشرياً.' : 'الخبر يحتاج مراجعة إضافية.', powered_by: 'local' });
});
});

app.post('/api/ai-chat', async (req, res) => {
    try {
        const { message = '', history = [] } = req.body || {};
        if (!message.trim()) return res.json({ reply: 'اكتب سؤالك بشكل واضح وسأجيبك مباشرة.' });

        const GEMINI_KEY = process.env.GEMINI_API_KEY;

        if (GEMINI_KEY) {
            try {
                const historyText = (Array.isArray(history) ? history : []).slice(-6)
                    .map(h => (h.role === 'user' ? 'المستخدم' : 'المساعد') + ': ' + String(h.content || '').trim())
                    .filter(Boolean).join('\n');

                const prompt = `أنت مساعد ذكي متخصص في مكافحة الشائعات والتحقق من المعلومات. أجب باللغة العربية بشكل واضح ومفيد.
${historyText ? `سياق المحادثة:\n${historyText}\n\n` : ''}السؤال الحالي: ${message.substring(0, 1500)}`;

                const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                const geminiData = await geminiRes.json();
                const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply) return res.json({ reply, powered_by: 'gemini' });
            } catch (err) {
                console.error('Gemini chat error:', err.message);
            }
        }

        // Fallback
        return res.json({ reply: `سؤالك: "${message}"\n\nأستطيع مساعدتك في التحقق من الأخبار والمعلومات. أرسل الخبر الذي تريد التحقق منه وسأحلله لك.\nللحصول على أفضل تحليل، أضف رابط المصدر إذا كان متاحاً.`, powered_by: 'local' });
    } catch (error) {
        return res.status(500).json({ error: 'failed to process ai chat', details: error.message });
    }
});

    } catch (error) {
        return res.status(500).json({ error: 'failed to process ai chat', details: error.message });
    }
});

// ========== NEW ADVANCED REPORT REVIEW SYSTEM ==========

// Get all reports with their review status
app.get('/api/reports-with-reviews', async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;
        let sql = `
            SELECT 
                r.report_id, r.title, r.description, r.category, r.status as report_status,
                r.created_at, u.name as reporter_name,
                rr.review_id, rr.reviewer_status, rr.admin_status, rr.spokesperson_status,
                rr.final_verdict, rr.reviewer_comment, rr.admin_comment, rr.spokesperson_comment
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN report_reviews rr ON r.report_id = rr.report_id
        `;
        const values = [];

        if (status) {
            sql += ' WHERE rr.final_verdict = ?';
            values.push(status);
        }

        sql += ' ORDER BY r.created_at DESC LIMIT ?';
        values.push(Number(limit) || 50);

        const reports = await query(sql, values);
        return res.json({ count: reports.length, reports });
    } catch (error) {
        return res.status(500).json({ error: 'failed to load reports with reviews', details: error.message });
    }
});

// Create or update report review
app.post('/api/reports/:id/review', async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewerId = null, adminId = null, spokespersonId = null } = req.body;

        // Check if report exists
        const reportRows = await query('SELECT report_id FROM reports WHERE report_id = ?', [id]);
        if (!reportRows.length) {
            return res.status(404).json({ error: 'report not found' });
        }

        // Insert or update review
        await query(
            `INSERT INTO report_reviews (report_id, reviewer_id, admin_id, spokesperson_id)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                reviewer_id = COALESCE(VALUES(reviewer_id), reviewer_id),
                admin_id = COALESCE(VALUES(admin_id), admin_id),
                spokesperson_id = COALESCE(VALUES(spokesperson_id), spokesperson_id)`,
            [id, reviewerId, adminId, spokespersonId]
        );

        return res.json({ message: 'review created/updated', reportId: Number(id) });
    } catch (error) {
        return res.status(500).json({ error: 'failed to create review', details: error.message });
    }
});

// Reviewer submits their assessment
app.put('/api/reports/:id/reviewer-assessment', async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewerId, comment = '', status = 'pending' } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'invalid status' });
        }

        const result = await query(
            `UPDATE report_reviews 
             SET reviewer_comment = ?, reviewer_status = ?, updated_at = CURRENT_TIMESTAMP
             WHERE report_id = ? AND reviewer_id = ?`,
            [comment, status, id, reviewerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'review not found' });
        }

        return res.json({ message: 'reviewer assessment submitted', reportId: Number(id) });
    } catch (error) {
        return res.status(500).json({ error: 'failed to submit assessment', details: error.message });
    }
});

// Admin submits their assessment
app.put('/api/reports/:id/admin-assessment', async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId, comment = '', status = 'pending' } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'invalid status' });
        }

        const result = await query(
            `UPDATE report_reviews 
             SET admin_comment = ?, admin_status = ?, updated_at = CURRENT_TIMESTAMP
             WHERE report_id = ? AND admin_id = ?`,
            [comment, status, id, adminId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'review not found' });
        }

        return res.json({ message: 'admin assessment submitted', reportId: Number(id) });
    } catch (error) {
        return res.status(500).json({ error: 'failed to submit assessment', details: error.message });
    }
});

// Spokesperson submits their assessment
app.put('/api/reports/:id/spokesperson-assessment', async (req, res) => {
    try {
        const { id } = req.params;
        const { spokespersonId, comment = '', status = 'pending', finalVerdict = 'unverified' } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'invalid status' });
        }

        if (!['true', 'false', 'unverified'].includes(finalVerdict)) {
            return res.status(400).json({ error: 'invalid final verdict' });
        }

        const result = await query(
            `UPDATE report_reviews 
             SET spokesperson_comment = ?, spokesperson_status = ?, final_verdict = ?, updated_at = CURRENT_TIMESTAMP
             WHERE report_id = ? AND spokesperson_id = ?`,
            [comment, status, finalVerdict, id, spokespersonId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'review not found' });
        }

        return res.json({ message: 'spokesperson assessment submitted', reportId: Number(id) });
    } catch (error) {
        return res.status(500).json({ error: 'failed to submit assessment', details: error.message });
    }
});

// Get report with full review details
app.get('/api/reports/:id/full-review', async (req, res) => {
    try {
        const { id } = req.params;

        const report = await query('SELECT * FROM reports WHERE report_id = ?', [id]);
        if (!report.length) {
            return res.status(404).json({ error: 'report not found' });
        }

        const evidence = await query('SELECT * FROM report_evidence WHERE report_id = ?', [id]);
        const review = await query('SELECT * FROM report_reviews WHERE report_id = ?', [id]);
        const reviewer = review.length && review[0].reviewer_id ? 
            await query('SELECT user_id, name FROM users WHERE user_id = ?', [review[0].reviewer_id]) : null;
        const admin = review.length && review[0].admin_id ? 
            await query('SELECT user_id, name FROM users WHERE user_id = ?', [review[0].admin_id]) : null;
        const spokesperson = review.length && review[0].spokesperson_id ? 
            await query('SELECT user_id, name FROM users WHERE user_id = ?', [review[0].spokesperson_id]) : null;

        return res.json({
            report: report[0],
            evidence,
            review: review.length ? review[0] : null,
            reviewerInfo: reviewer && reviewer.length ? reviewer[0] : null,
            adminInfo: admin && admin.length ? admin[0] : null,
            spokespersonInfo: spokesperson && spokesperson.length ? spokesperson[0] : null,
        });
    } catch (error) {
        return res.status(500).json({ error: 'failed to load full review', details: error.message });
    }
});

// Get external links configuration
app.get('/api/external-links', async (req, res) => {
    try {
        const links = await query(
            'SELECT link_id, name, url, description, category, link_type, icon FROM external_links_config WHERE is_active = 1 ORDER BY category, name'
        );
        return res.json({ links });
    } catch (error) {
        return res.status(500).json({ error: 'failed to load external links', details: error.message });
    }
});

// Update article and sync with dashboard
app.put('/api/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, tags, isPublished } = req.body;

        await query(
            'UPDATE articles SET title = ?, content = ?, category = ?, tags = ?, is_published = ? WHERE article_id = ?',
            [title, content, category, tags, isPublished ? 1 : 0, id]
        );

        return res.json({ message: 'article updated and synced', articleId: Number(id) });
    } catch (error) {
        return res.status(500).json({ error: 'failed to update article', details: error.message });
    }
});

app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    }
    if (err) {
        return res.status(400).json({ error: err.message || 'request failed' });
    }
    return res.status(500).json({ error: 'unexpected error' });
});

const PORT = process.env.PORT || 5000;

// ========== VIDEOS API ==========
app.get('/api/videos', async (req, res) => {
    try {
        const videos = await query('SELECT * FROM awareness_videos ORDER BY created_at DESC');
        return res.json({ count: videos.length, videos });
    } catch (error) {
        return res.status(500).json({ error: 'failed to load videos', details: error.message });
    }
});

app.post('/api/videos', async (req, res) => {
    try {
        const { title, description = '', video_url, platform = 'youtube' } = req.body;
        if (!title || !video_url) return res.status(400).json({ error: 'title and video_url are required' });
        const result = await query(
            'INSERT INTO awareness_videos (title, description, video_url, platform) VALUES (?, ?, ?, ?)',
            [title, description, video_url, platform]
        );
        return res.json({ success: true, video_id: result.insertId });
    } catch (error) {
        return res.status(500).json({ error: 'failed to add video', details: error.message });
    }
});

app.delete('/api/videos/:id', async (req, res) => {
    try {
        await query('DELETE FROM awareness_videos WHERE video_id = ?', [req.params.id]);
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: 'failed to delete video', details: error.message });
    }
});
// ========== END VIDEOS API ==========


app.delete('/api/articles/:id', async (req, res) => {
    try {
        await query('DELETE FROM articles WHERE article_id = ?', [req.params.id]);
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: 'failed to delete article', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
});
