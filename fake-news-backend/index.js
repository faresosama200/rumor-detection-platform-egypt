// index.js - Backend API
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'rumor-platform-secret-2024';

// CORS
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// MySQL Pool
const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'fake_news_db',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 30000,
};

let pool;
async function getPool() {
    if (!pool) pool = mysql.createPool(dbConfig);
    return pool;
}

async function query(sql, params = []) {
    const p = await getPool();
    const [rows] = await p.execute(sql, params);
    return rows;
}

// Auth middleware
function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'غير مصرح' });
    try {
        req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
        next();
    } catch(e) { res.status(401).json({ message: 'توكن غير صالح' }); }
}

function adminOnly(req, res, next) {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'للمدير فقط' });
    next();
}

// ===== HEALTH =====
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/', (req, res) => res.json({ message: 'منصة مكافحة الشائعات - API', status: 'running' }));

// ===== AUTH =====
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
        const existing = await query('SELECT user_id FROM users WHERE email=?', [email]);
        if (existing.length) return res.status(409).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
        const hash = await bcrypt.hash(password, 10);
        await query('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)', [name, email, hash, 'user']);
        res.status(201).json({ message: 'تم التسجيل بنجاح' });
    } catch(e) { res.status(500).json({ message: 'خطأ في السيرفر', error: e.message }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'البريد وكلمة المرور مطلوبان' });
        const users = await query('SELECT * FROM users WHERE email=?', [email]);
        if (!users.length) return res.status(401).json({ message: 'بيانات غير صحيحة' });
        const user = users[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ message: 'بيانات غير صحيحة' });
        const token = jwt.sign({ userId: user.user_id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, role: user.role, userId: user.user_id, name: user.name });
    } catch(e) { res.status(500).json({ message: 'خطأ في السيرفر', error: e.message }); }
});

// ===== REPORTS =====
app.get('/api/reports', authMiddleware, async (req, res) => {
    try {
        const { status, category, page = 1, limit = 20 } = req.query;
        let sql = 'SELECT r.*, u.name as user_name FROM reports r LEFT JOIN users u ON r.user_id=u.user_id WHERE 1=1';
        const params = [];
        if (status) { sql += ' AND r.status=?'; params.push(status); }
        if (category) { sql += ' AND r.category=?'; params.push(category); }
        sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), (parseInt(page)-1)*parseInt(limit));
        const rows = await query(sql, params);
        res.json(rows);
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.post('/api/reports', authMiddleware, upload.array('files', 5), async (req, res) => {
    try {
        const { title, description, source_url, category, tags } = req.body;
        if (!title || !description) return res.status(400).json({ message: 'العنوان والوصف مطلوبان' });
        const result = await query(
            'INSERT INTO reports (user_id,title,description,source_url,category,tags,status) VALUES (?,?,?,?,?,?,?)',
            [req.user.userId, title, description, source_url||null, category||'general', tags||null, 'pending']
        );
        const reportId = result.insertId;
        if (req.files && req.files.length) {
            for (const f of req.files) {
                await query('INSERT INTO report_evidence (report_id,file_name,file_path,mime_type,file_size) VALUES (?,?,?,?,?)',
                    [reportId, f.originalname, f.filename, f.mimetype, f.size]);
            }
        }
        res.status(201).json({ message: 'تم الإبلاغ بنجاح', reportId });
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.get('/api/reports/:id', authMiddleware, async (req, res) => {
    try {
        const rows = await query('SELECT r.*, u.name as user_name FROM reports r LEFT JOIN users u ON r.user_id=u.user_id WHERE r.report_id=?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: 'غير موجود' });
        const evidence = await query('SELECT * FROM report_evidence WHERE report_id=?', [req.params.id]);
        res.json({ ...rows[0], evidence });
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.put('/api/reports/:id', authMiddleware, async (req, res) => {
    try {
        const { status, admin_notes } = req.body;
        await query('UPDATE reports SET status=?, admin_notes=?, updated_at=NOW() WHERE report_id=?', [status, admin_notes||null, req.params.id]);
        res.json({ message: 'تم التحديث' });
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.delete('/api/reports/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        await query('DELETE FROM reports WHERE report_id=?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

// ===== AI VERIFY with Gemini =====
app.post('/api/verify-ai', authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'النص مطلوب' });

        const GEMINI_KEY = process.env.GEMINI_API_KEY;

        if (GEMINI_KEY) {
            const prompt = `أنت خبير في التحقق من المعلومات والأخبار. حلل النص التالي وحدد إذا كان شائعة أو حقيقة:

النص: "${text}"

أجب بـ JSON فقط بالشكل التالي (لا تضف أي نص خارج JSON):
{
  "confidence": <رقم من 0 إلى 100 يمثل نسبة الثقة في أن المعلومة صحيحة>,
  "verdict": "<صحيح | مشبوه | شائعة>",
  "summary": "<ملخص قصير للتحليل بالعربية>",
  "reasons": ["<سبب 1>", "<سبب 2>", "<سبب 3>"]
}`;

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (response.ok) {
                const data = await response.json();
                const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    return res.json({ ...result, source: 'gemini' });
                }
            }
        }

        // Fallback: local analysis
        const lower = text.toLowerCase();
        const suspiciousWords = ['عاجل','خطير','انتشار','انتبه','خبر مهم','يجب مشاركة','حصري','مجاني','ربح سريع','تحذير'];
        const count = suspiciousWords.filter(w => text.includes(w)).length;
        const confidence = Math.max(10, 75 - count * 10);
        const verdict = confidence >= 60 ? 'مشبوه' : confidence >= 30 ? 'شائعة محتملة' : 'صحيح غالباً';

        res.json({
            confidence,
            verdict,
            summary: 'تحليل محلي - أضف GEMINI_API_KEY للحصول على تحليل دقيق',
            reasons: [
                count > 0 ? `وُجدت ${count} كلمات تثير الشك` : 'لا توجد كلمات مشبوهة واضحة',
                'تحقق من المصدر الأصلي للخبر',
                'قارن مع وسائل الإعلام الرسمية'
            ],
            source: 'local'
        });
    } catch(e) { res.status(500).json({ message: 'خطأ في التحليل', error: e.message }); }
});

// ===== AI CHAT with Gemini =====
app.post('/api/ai-chat', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: 'الرسالة مطلوبة' });

        const GEMINI_KEY = process.env.GEMINI_API_KEY;

        if (GEMINI_KEY) {
            const prompt = `أنت مساعد ذكي متخصص في مكافحة الشائعات والمعلومات المضللة في مصر والعالم العربي. أجب باللغة العربية بشكل واضح ومفيد.

سؤال المستخدم: ${message}`;

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply) return res.json({ reply, source: 'gemini' });
            }
        }

        // Fallback
        const replies = {
            'شائعة': 'الشائعة هي معلومة غير موثقة تنتشر بسرعة. تحقق دائماً من المصدر الرسمي قبل المشاركة.',
            'تحقق': 'للتحقق من الأخبار: تأكد من المصدر، ابحث في محركات البحث، راجع المواقع الرسمية.',
            'مصدر': 'المصادر الموثوقة تشمل: وزارة الصحة، الداخلية، وكالة أنباء الشرق الأوسط.',
        };
        const key = Object.keys(replies).find(k => message.includes(k));
        res.json({ reply: key ? replies[key] : 'يمكنني مساعدتك في التحقق من المعلومات ومكافحة الشائعات. اسألني عن أي خبر أو معلومة.', source: 'local' });
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

// ===== ARTICLES =====
app.get('/api/articles', async (req, res) => {
    try {
        const rows = await query('SELECT a.*, u.name as author FROM articles a LEFT JOIN users u ON a.created_by=u.user_id WHERE a.is_published=1 ORDER BY a.created_at DESC');
        res.json(rows);
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.post('/api/articles', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { title, content, category, tags, is_published } = req.body;
        if (!title || !content) return res.status(400).json({ message: 'العنوان والمحتوى مطلوبان' });
        const result = await query(
            'INSERT INTO articles (title,content,category,tags,is_published,created_by) VALUES (?,?,?,?,?,?)',
            [title, content, category||'awareness', tags||null, is_published!==false?1:0, req.user.userId]
        );
        res.status(201).json({ message: 'تم إضافة المقال', articleId: result.insertId });
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.put('/api/articles/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { title, content, category, tags, is_published } = req.body;
        await query('UPDATE articles SET title=?,content=?,category=?,tags=?,is_published=? WHERE article_id=?',
            [title, content, category||'awareness', tags||null, is_published!==false?1:0, req.params.id]);
        res.json({ message: 'تم التعديل' });
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.delete('/api/articles/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        await query('DELETE FROM articles WHERE article_id=?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

// ===== VIDEOS =====
app.get('/api/videos', authMiddleware, async (req, res) => {
    try {
        const rows = await query('SELECT * FROM awareness_videos ORDER BY created_at DESC');
        res.json(rows);
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.post('/api/videos', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { title, description, video_url, platform } = req.body;
        if (!title || !video_url) return res.status(400).json({ message: 'العنوان والرابط مطلوبان' });
        const result = await query(
            'INSERT INTO awareness_videos (title,description,video_url,platform) VALUES (?,?,?,?)',
            [title, description||null, video_url, platform||'youtube']
        );
        res.status(201).json({ message: 'تم الإضافة', videoId: result.insertId });
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.delete('/api/videos/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        await query('DELETE FROM awareness_videos WHERE video_id=?', [req.params.id]);
        res.json({ message: 'تم الحذف' });
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

// ===== ADMIN =====
app.get('/api/admin/stats', authMiddleware, adminOnly, async (req, res) => {
    try {
        const [reports] = await Promise.all([query('SELECT COUNT(*) as total FROM reports')]);
        const [pending] = [await query("SELECT COUNT(*) as total FROM reports WHERE status='pending'")];
        const [users] = [await query('SELECT COUNT(*) as total FROM users')];
        const [articles] = [await query('SELECT COUNT(*) as total FROM articles')];
        const [videos] = [await query('SELECT COUNT(*) as total FROM awareness_videos')];
        res.json({
            reports: reports[0].total, pending: pending[0].total,
            users: users[0].total, articles: articles[0].total, videos: videos[0].total
        });
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.get('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
    try {
        const rows = await query('SELECT user_id,name,email,role,created_at FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.put('/api/admin/users/:id/role', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { role } = req.body;
        await query('UPDATE users SET role=? WHERE user_id=?', [role, req.params.id]);
        res.json({ message: 'تم تحديث الدور' });
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.get('/api/sources', authMiddleware, async (req, res) => {
    try {
        const rows = await query('SELECT * FROM sources ORDER BY credibility_score DESC');
        res.json(rows);
    } catch(e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
