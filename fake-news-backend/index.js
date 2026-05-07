// index.js – Backend API
const express  = require('express');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const mysql    = require('mysql2/promise');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'rumor-platform-secret-2024';

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename:    (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const dbCfg = {
  host:     process.env.DB_HOST     || process.env.MYSQLHOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
  user:     process.env.DB_USER     || process.env.MYSQLUSER     || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME     || process.env.MYSQLDATABASE || 'railway',
  charset:  'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 30000,
};
let _pool;
const getPool = () => { if (!_pool) _pool = mysql.createPool(dbCfg); return _pool; };
const q = async (sql, p = []) => { const [r] = await getPool().execute(sql, p); return r; };
const APP_STATS_BASELINE_KEY = 'stats_start_at';
let _statsStartAtCache = null;

async function ensureAppSettingsTable() {
  await q(`CREATE TABLE IF NOT EXISTS app_settings (
    key_name VARCHAR(120) PRIMARY KEY,
    value_text VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`).catch(() => {});
}

async function getStatsStartAt() {
  if (_statsStartAtCache) return _statsStartAtCache;
  await ensureAppSettingsTable();
  const rows = await q('SELECT value_text FROM app_settings WHERE key_name=? LIMIT 1', [APP_STATS_BASELINE_KEY]).catch(() => []);
  if (rows?.length && rows[0].value_text) {
    _statsStartAtCache = rows[0].value_text;
    return _statsStartAtCache;
  }
  const nowIso = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await q(
    'INSERT INTO app_settings (key_name, value_text) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_text=VALUES(value_text)',
    [APP_STATS_BASELINE_KEY, nowIso]
  ).catch(() => {});
  _statsStartAtCache = nowIso;
  return _statsStartAtCache;
}

async function getTableColumns(tableName) {
  try {
    const rows = await q(`SHOW COLUMNS FROM ${tableName}`);
    return new Set((rows || []).map(r => String(r.Field || '').toLowerCase()));
  } catch {
    return new Set();
  }
}

const WORLD_RUMOR_FEEDS = [
  'https://feeds.bbci.co.uk/arabic/world/rss.xml',
  'https://www.aljazeera.net/aljazeerarss/arabic/news',
  'https://www.skynewsarabia.com/web/rss',
];
const WORLD_RUMOR_KEYWORDS = [
  'شائعة', 'إشاعة', 'مضلل', 'كاذب', 'تضليل', 'تشويه', 'مفبرك', 'حرب معلومات', 'عاجل', 'تداول'
];
let worldRumorsCache = { at: 0, items: [] };

const decodeXmlEntities = (text = '') => String(text)
  .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&nbsp;/g, ' ')
  .trim();

const stripHtmlTags = (text = '') => decodeXmlEntities(String(text).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

function parseRssItems(xmlText = '') {
  const items = [];
  const blocks = String(xmlText).match(/<item\b[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    const title = decodeXmlEntities((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const link = decodeXmlEntities((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '');
    const pubDateRaw = decodeXmlEntities((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || '');
    const descRaw = decodeXmlEntities((block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || '');
    if (!title) continue;
    items.push({
      title: stripHtmlTags(title),
      link,
      description: stripHtmlTags(descRaw),
      created_at: pubDateRaw && !Number.isNaN(Date.parse(pubDateRaw))
        ? new Date(pubDateRaw).toISOString()
        : new Date().toISOString(),
    });
  }
  return items;
}

async function fetchWorldRumors(limit = 10) {
  const now = Date.now();
  if (now - worldRumorsCache.at < 5 * 60 * 1000 && worldRumorsCache.items.length) {
    return worldRumorsCache.items.slice(0, limit);
  }

  const aggregated = [];
  for (const feedUrl of WORLD_RUMOR_FEEDS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      let response;
      try {
        response = await fetch(feedUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'RumorPlatform/1.0 (+world-watch)' },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) continue;
      const xml = await response.text();
      const parsed = parseRssItems(xml).map(item => ({
        ...item,
        feed: feedUrl,
      }));
      aggregated.push(...parsed);
    } catch {
      // Ignore failed external feed and continue with other sources.
    }
  }

  const seen = new Set();
  const prepared = aggregated
    .filter(item => {
      const hay = `${item.title} ${item.description}`;
      const isRumorLike = WORLD_RUMOR_KEYWORDS.some(k => hay.includes(k));
      const key = item.title.toLowerCase();
      if (!isRumorLike || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, Math.max(limit, 20))
    .map((item, idx) => ({
      id: `world-${idx}-${Buffer.from(item.title).toString('base64').slice(0, 10)}`,
      type: 'world-rumor',
      status: 'watch',
      title: item.title,
      created_at: item.created_at,
      source_url: item.link,
    }));

  worldRumorsCache = { at: now, items: prepared };
  return prepared.slice(0, limit);
}

const getGroqKey       = () => process.env.GROQ_API_KEY       || '';
const getGeminiKey     = () => process.env.GEMINI_API_KEY     || process.env.GOOGLE_API_KEY || '';
const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY || '';

// ── Pollinations AI (free, no API key needed) ─────────────────────────────
async function callPollinations(messages) {
  try {
    const userRaw = (messages.find(m => m.role === 'user') || messages[messages.length - 1])?.content || '';
    const userMsg = String(userRaw).substring(0, 1200);
    const sysMsg  = messages.find(m => m.role === 'system')?.content || '';
    const params  = new URLSearchParams({ model: 'openai', seed: String(Math.floor(Math.random()*9999)) });
    if (sysMsg) params.set('system', sysMsg.substring(0, 600));
    const url = `https://text.pollinations.ai/${encodeURIComponent(userMsg)}?${params}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    let r;
    try { r = await fetch(url, { method: 'GET', signal: controller.signal }); }
    finally { clearTimeout(timer); }
    if (!r.ok) return { ok: false, error: `Pollinations HTTP ${r.status}` };
    const text = (await r.text()).trim();
    if (text && text.length > 5) return { ok: true, text, model: 'pollinations-text' };
    return { ok: false, error: 'Empty response' };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function callHuggingFace(messages) {
  if (!process.env.HF_API_TOKEN) {
    return { ok: false, error: 'HF_API_TOKEN not configured' };
  }
  const userMsg = (messages.find(m => m.role === 'user') || messages[messages.length - 1])?.content || '';
  const models = [
    'mistralai/Mistral-7B-Instruct-v0.3',
    'microsoft/Phi-3-mini-4k-instruct',
    'HuggingFaceH4/zephyr-7b-beta',
  ];
  const hfToken = process.env.HF_API_TOKEN || '';
  const headers = { 'Content-Type': 'application/json' };
  if (hfToken) headers['Authorization'] = `Bearer ${hfToken}`;
  let lastError = 'HuggingFace error';
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      let r;
      try {
        r = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ inputs: userMsg, parameters: { max_new_tokens: 800, return_full_text: false } }),
          signal: controller.signal,
        });
      } finally { clearTimeout(timer); }
      const data = await r.json().catch(() => null);
      if (!r.ok) { lastError = data?.error || `HTTP ${r.status}`; continue; }
      const text = (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text)?.trim();
      if (text && text.length > 5) return { ok: true, text, model };
      lastError = 'Empty HF response';
    } catch (e) { lastError = e.message; }
  }
  return { ok: false, error: lastError };
}

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama3-70b-8192'];
const GROQ_VISION_MODEL = 'llama-3.2-90b-vision-preview';
async function callGroq(messages, key, useVision = false) {
  const models = useVision ? [GROQ_VISION_MODEL] : GROQ_MODELS;
  let lastError = 'Unknown Groq error';
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      let r;
      try {
        r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1500 }),
          signal: controller.signal,
        });
      } finally { clearTimeout(timer); }
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { lastError = data.error?.message || `HTTP ${r.status}`; continue; }
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return { ok: true, text, model };
      lastError = 'Empty Groq response';
    } catch (e) { lastError = e.message; }
  }
  return { ok: false, error: lastError };
}

// ── Gemini (Google) ────────────────────────────────────────────────────────
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

function extractGeminiText(data = {}) {
  return (data.candidates?.[0]?.content?.parts || [])
    .map(p => p.text).filter(Boolean).join('\n').trim();
}

async function callGemini(messagesOrPrompt, key) {
  const apis = [
    { version: 'v1', models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'] },
    { version: 'v1beta', models: ['gemini-2.0-flash', 'gemini-1.5-flash'] },
  ];
  let lastError = 'Unknown Gemini error';
  
  // Convert OpenAI-style messages to Gemini format
  let geminiContents = [];
  if (typeof messagesOrPrompt === 'string') {
    // Simple string prompt
    geminiContents = [{ parts: [{ text: messagesOrPrompt }] }];
  } else if (Array.isArray(messagesOrPrompt)) {
    // Messages array (OpenAI format) - convert to Gemini
    for (const msg of messagesOrPrompt) {
      if (msg.role === 'user') {
        if (Array.isArray(msg.content)) {
          // Complex content with images
          const parts = [];
          for (const part of msg.content) {
            if (part.type === 'text') {
              parts.push({ text: part.text });
            } else if (part.type === 'image_url') {
              const imageUrl = part.image_url?.url || '';
              if (imageUrl.startsWith('data:')) {
                const [metadata, data] = imageUrl.split(',');
                const mimeType = metadata.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
                parts.push({ inlineData: { mimeType, data: data.split(',')[1] || data } });
              } else {
                parts.push({ text: `[Image: ${imageUrl}]` });
              }
            }
          }
          if (parts.length > 0) {
            geminiContents.push({ parts });
          }
        } else if (typeof msg.content === 'string') {
          geminiContents.push({ parts: [{ text: msg.content }] });
        }
      }
    }
  }
  
  if (geminiContents.length === 0) {
    return { ok: false, error: 'No valid content for Gemini' };
  }
  
  for (const api of apis) {
    for (const model of api.models) {
      try {
        const url = `https://generativelanguage.googleapis.com/${api.version}/models/${model}:generateContent?key=${key}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 25000);
        let r;
        try {
          r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: geminiContents }),
            signal: controller.signal,
          });
        } finally { clearTimeout(timer); }
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { lastError = data.error?.message || `HTTP ${r.status}`; continue; }
        const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
        if (text && text.length > 5) return { ok: true, text, model: `${model}` };
        lastError = 'Empty Gemini response';
      } catch (e) { lastError = e.message; }
    }
  }
  return { ok: false, error: lastError };
}
const OPENROUTER_MODELS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'meta-llama/llama-4-scout:free',
  'google/gemini-2.0-flash-exp:free',
  'mistralai/mistral-7b-instruct:free',
];
async function callOpenRouter(messages, key) {
  let lastError = 'Unknown OpenRouter error';
  for (const model of OPENROUTER_MODELS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      let r;
      try {
        r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': 'https://backend-production-03bc.up.railway.app',
            'X-Title': 'Rumor Detection Platform',
          },
          body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1500 }),
          signal: controller.signal,
        });
      } finally { clearTimeout(timer); }
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { lastError = data.error?.message || `HTTP ${r.status}`; continue; }
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return { ok: true, text, model };
      lastError = 'Empty OpenRouter response';
    } catch (e) { lastError = e.message; }
  }
  return { ok: false, error: lastError };
}

async function callAI(messages, promptText) {
  const OR_KEY  = getOpenRouterKey();
  const GR_KEY  = getGroqKey();
  const GEM_KEY = getGeminiKey();

  // 1. Pollinations (free, no key)
  const poll = await callPollinations(messages);
  if (poll.ok) return { ...poll, source: 'pollinations' };
  console.log('Pollinations failed:', poll.error);

  // Retry Pollinations once when rate-limited with shorter content.
  if (String(poll.error || '').includes('HTTP 429')) {
    const retryMessages = messages.map((m) => {
      if (m.role === 'user' && typeof m.content === 'string') {
        return { ...m, content: m.content.substring(0, 500) };
      }
      return m;
    });
    const pollRetry = await callPollinations(retryMessages);
    if (pollRetry.ok) return { ...pollRetry, source: 'pollinations' };
    console.log('Pollinations retry failed:', pollRetry.error);
  }

  // 2. HuggingFace (free, no key needed)
  if (process.env.HF_API_TOKEN) {
    const hf = await callHuggingFace(messages);
    if (hf.ok) return { ...hf, source: 'huggingface' };
    console.log('HuggingFace failed:', hf.error);
  }

  // 3. OpenRouter (needs key)
  if (OR_KEY) {
    const r = await callOpenRouter(messages, OR_KEY);
    if (r.ok) return { ...r, source: 'openrouter' };
    console.log('OpenRouter failed:', r.error);
  }

  // 4. Groq (needs valid key)
  if (GR_KEY) {
    const r = await callGroq(messages, GR_KEY);
    if (r.ok) return { ...r, source: 'groq' };
    console.log('Groq failed:', r.error);
  }

  // 5. Gemini (needs valid key)
  if (GEM_KEY) {
    const r = await callGemini(messages, GEM_KEY);
    if (r.ok) return { ...r, source: 'gemini' };
    console.log('Gemini failed:', r.error);
  }

  return { ok: false };
}

const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'غير مصرح' });
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (_e) {
    return res.status(401).json({ message: 'رمز دخول غير صالح' });
  }
};

const authOptional = (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    req.user = token ? jwt.verify(token, JWT_SECRET) : null;
  } catch (_e) {
    req.user = null;
  }
  next();
};

const admin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'يتطلب صلاحية المشرف' });
  }
  return next();
};

const reportModerator = (req, res, next) => {
  if (!['admin', 'reviewer'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'يتطلب صلاحية المدير أو المراجع' });
  }
  return next();
};

const ensureFieldInterviewsTable = async () => {
  await q(`CREATE TABLE IF NOT EXISTS field_interviews (
    interview_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    place VARCHAR(255),
    image_url VARCHAR(500),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`).catch(() => {});
};

const parsePublishedFlag = (value, defaultValue = 1) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value ? 1 : 0;
  const norm = String(value).trim().toLowerCase();
  if (['0', 'false', 'no', 'off'].includes(norm)) return 0;
  if (['1', 'true', 'yes', 'on'].includes(norm)) return 1;
  return defaultValue;
};

// ─── Health ───────────────────────────────────────────────────
app.get('/',            (_req, res) => res.json({ message: 'منصة مكافحة الشائعات API', status: 'running' }));
app.get('/api/health',  (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/ai-status', (_req, res) => {
  const configured = !!getGroqKey();
  res.json({ configured, provider: configured ? 'groq' : 'local-fallback' });
});

// ─── Auth ─────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    const ex = await q('SELECT user_id FROM users WHERE email=?', [email]);
    if (ex.length) return res.status(409).json({ message: 'البريد مستخدم بالفعل' });
    const hash = await bcrypt.hash(password, 10);
    await q('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)', [name, email, hash, 'user']);
    res.status(201).json({ message: 'تم التسجيل بنجاح' });
  } catch (e) { res.status(500).json({ message: 'خطأ في السيرفر', error: e.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'البريد وكلمة المرور مطلوبان' });
    const users = await q('SELECT * FROM users WHERE email=?', [email]);
    if (!users.length) return res.status(401).json({ message: 'بيانات غير صحيحة' });
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'بيانات غير صحيحة' });
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ token, role: user.role, userId: user.user_id, name: user.name });
  } catch (e) { res.status(500).json({ message: 'خطأ في السيرفر', error: e.message }); }
});

// ─── Reports ──────────────────────────────────────────────────
app.get('/api/reports', auth, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 50 } = req.query;
    const canSeeAllReports = ['admin', 'reviewer'].includes(req.user?.role);
    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, Number.parseInt(limit, 10) || 50));
    const offsetNum = (pageNum - 1) * limitNum;

    const where = ['1=1'];
    const p = [];
    if (!canSeeAllReports) { where.push('r.user_id=?'); p.push(req.user.userId); }
    if (status)   { where.push('r.status=?'); p.push(status); }
    if (category) { where.push('r.category=?'); p.push(category); }

    const whereSql = where.join(' AND ');
    const rowsSql = `SELECT r.*, u.name as user_name, u.email as user_email
                     FROM reports r
                     LEFT JOIN users u ON r.user_id=u.user_id
                     WHERE ${whereSql}
                     ORDER BY r.created_at DESC
                     LIMIT ${limitNum} OFFSET ${offsetNum}`;
    const rows = await q(rowsSql, p);

    const countSql = `SELECT COUNT(*) as total FROM reports r WHERE ${whereSql}`;
    const countRows = await q(countSql, p);
    const total = Number(countRows?.[0]?.total || 0);
    res.json({ reports: rows, total });
  } catch (e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.post('/api/reports', authOptional, upload.array('files', 5), async (req, res) => {
  try {
    const { title, description, source_url, category, tags } = req.body;
    if (!title || !description) return res.status(400).json({ message: 'العنوان والوصف مطلوبان' });
    const result = await q(
      'INSERT INTO reports (user_id,title,description,source_url,category,tags,status) VALUES (?,?,?,?,?,?,?)',
      [req.user?.userId || null, title, description, source_url || null, category || 'general', tags || null, 'pending']
    );
    const reportId = result.insertId;
    if (req.files?.length) {
      for (const f of req.files) {
        await q('INSERT INTO report_evidence (report_id,file_name,file_path,mime_type,file_size) VALUES (?,?,?,?,?)',
          [reportId, f.originalname, f.filename, f.mimetype, f.size]);
      }
    }
    res.status(201).json({ message: 'تم الإبلاغ بنجاح', reportId });
  } catch (e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.get('/api/reports/:id', auth, async (req, res) => {
  try {
    const rows = await q('SELECT r.*, u.name as user_name FROM reports r LEFT JOIN users u ON r.user_id=u.user_id WHERE r.report_id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'غير موجود' });
    const evidence = await q('SELECT * FROM report_evidence WHERE report_id=?', [req.params.id]);
    res.json({ ...rows[0], evidence });
  } catch (e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.put('/api/reports/:id', auth, reportModerator, async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    if (!status) return res.status(400).json({ message: 'الحالة مطلوبة' });
    await q('UPDATE reports SET status=?, admin_notes=?, updated_at=NOW() WHERE report_id=?', [status, admin_notes || null, req.params.id]);
    res.json({ message: 'تم تحديث البلاغ بنجاح' });
  } catch (e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.delete('/api/reports/:id', auth, admin, async (req, res) => {
  try { await q('DELETE FROM reports WHERE report_id=?', [req.params.id]); res.json({ message: 'تم الحذف' }); }
  catch (e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

// ─── AI Verify ────────────────────────────────────────────────
app.post('/api/verify-ai', async (req, res) => {
  try {
    const { text, mediaType, mediaBase64, mediaMime, mediaUrl } = req.body;
    if (!text && !mediaBase64 && !mediaUrl) {
      return res.status(400).json({ message: 'أدخل نصاً أو صورة أو فيديو للتحقق' });
    }

    const prompt = `أنت خبير متخصص في التحقق من المعلومات ومكافحة الشائعات في مصر والعالم العربي.
حلل النص التالي بدقة وحدد إذا كان شائعة أو معلومة صحيحة:

النص: "${text || 'لا يوجد نص، اعتمد على الوسيط المرفق'}"
نوع الوسيط: ${mediaType || 'none'}
${mediaUrl ? `رابط الوسيط: ${mediaUrl}` : ''}

أجب بـ JSON فقط بدون أي نص خارجه:
{
  "confidence": <رقم من 0 إلى 100 يمثل نسبة الاشتباه في كون المحتوى شائعة>,
  "verdict": "<صحيح غالباً | مشبوه | شائعة محتملة>",
  "summary": "<ملخص تحليل مفصل بالعربية>",
  "reasons": ["<سبب 1>", "<سبب 2>", "<سبب 3>"],
  "recommendations": "<توصيات للتحقق من الخبر>"
}`;

    const hasImage = !!(mediaBase64 && mediaMime);
    const jsonInstruction = '\n\nMUST reply with ONLY a valid JSON object. No markdown, no explanation, just raw JSON.';
    const messages = hasImage
      ? [
          { role: 'system', content: 'You are a fact-checker. Always respond with pure JSON only, no extra text.' },
          { role: 'user', content: [
            { type: 'text', text: prompt + jsonInstruction },
            { type: 'image_url', image_url: { url: `data:\${mediaMime};base64,\${mediaBase64}` } },
          ] }
        ]
      : [
          { role: 'system', content: 'You are a fact-checker. Always respond with pure JSON only, no extra text.' },
          { role: 'user', content: prompt + jsonInstruction }
        ];

    const aiResult = await callAI(messages, prompt);
    if (!aiResult.ok) {
      const base = String(text || mediaUrl || '').toLowerCase();
      const bad = ['عاجل', 'كارثة', 'صدمة', 'حصري', 'انتشر', 'بدون مصدر'];
      const score = bad.filter((k) => base.includes(k)).length;
      const confidence = Math.min(95, 35 + score * 12);
      return res.json({
        confidence,
        verdict: confidence >= 60 ? 'شائعة محتملة' : confidence >= 40 ? 'مشبوه' : 'صحيح غالباً',
        summary: 'تعذر الوصول إلى الذكاء الاصطناعي حالياً، وتم تشغيل تحليل احتياطي.',
        reasons: ['تعذر الاتصال بمزود الذكاء الاصطناعي مؤقتاً', 'النتيجة الحالية تقديرية', 'يرجى إعادة المحاولة بعد قليل'],
        recommendations: 'أعد التحقق بعد دقائق وقارن مع مصادر رسمية',
        source: 'local-fallback',
      });
    }

    // Try to extract JSON from response
    let parsed = null;
    const jsonMatch = aiResult.text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch {}
    }
    // Try to find JSON block in markdown code block
    if (!parsed) {
      const codeMatch = aiResult.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeMatch) { try { parsed = JSON.parse(codeMatch[1]); } catch {} }
    }
    // Try greedy match for nested JSON
    if (!parsed) {
      const greedyMatch = aiResult.text.match(/\{[\s\S]*\}/);
      if (greedyMatch) { try { parsed = JSON.parse(greedyMatch[0]); } catch {} }
    }
    if (parsed && parsed.confidence !== undefined) {
      return res.json({ ...parsed, source: aiResult.source, model: aiResult.model });
    }
    // AI responded but no JSON — do keyword analysis on original text + AI summary
    const analysisText = String(text || mediaUrl || '') + ' ' + aiResult.text;
    const base2 = analysisText.toLowerCase();
    const badKeywords = ['عاجل', 'كارثة', 'صدمة', 'حصري', 'انتشر', 'بدون مصدر', 'شائعة', 'كذب', 'مضلل'];
    const score2 = badKeywords.filter((k) => base2.includes(k)).length;
    const confidence2 = Math.min(90, 30 + score2 * 10);
    return res.json({
      confidence: confidence2,
      verdict: confidence2 >= 60 ? 'شائعة محتملة' : confidence2 >= 35 ? 'مشبوه' : 'صحيح غالباً',
      summary: aiResult.text.substring(0, 400),
      reasons: ['تم التحليل النصي بواسطة الذكاء الاصطناعي', 'النتيجة مبنية على تحليل الكلمات المفتاحية والسياق'],
      recommendations: 'راجع مصادر موثوقة للتأكد من صحة المعلومة',
      source: aiResult.source,
    });
  } catch (e) { res.status(500).json({ message: 'خطأ في التحليل', error: e.message }); }
});

// ─── AI Chat (Gemini) ─────────────────────────────────────────
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'الرسالة مطلوبة' });
    const system = 'أنت مساعد ذكي متخصص في مكافحة الشائعات والمعلومات المضللة في مصر والعالم العربي. أجب باللغة العربية بشكل واضح ومفيد.';
    const prompt = `${system}\n\nسؤال المستخدم: ${message}`;
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: String(message).substring(0, 1200) },
    ];
    const result = await callAI(messages, prompt);
    if (result.ok) {
      return res.json({ reply: result.text, source: result.source, model: result.model });
    }
    const localReply = [
      'التحقق من الأخبار يتم عبر خطوات عملية سريعة:',
      '1) افحص المصدر الأصلي للخبر وليس النسخ المنقولة.',
      '2) قارن الخبر مع مصدرين موثوقين على الأقل.',
      '3) راجع تاريخ النشر والصور باستخدام البحث العكسي.',
      '4) انتبه للعناوين المبالغ فيها أو التي بلا دليل واضح.',
      '5) لا تنشر الخبر قبل التأكد من جهة رسمية أو مؤسسة إعلامية موثوقة.',
      '',
      `سؤالك: ${String(message).substring(0, 220)}`,
    ].join('\n');
    return res.json({
      reply: localReply,
      source: 'local-assistant',
      model: 'rule-based-ar-v1',
    });
  } catch (e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

// ─── Articles ─────────────────────────────────────────────────
app.get('/api/articles', async (req, res) => {
  try {
    const { category, limit } = req.query;
    // Seed starter articles if none exist
    try {
      const [[{cnt}]] = [await q('SELECT COUNT(*) as cnt FROM articles')];
      if (cnt === 0) {
        const starterArticles = [
          ['أهمية التحقق من المعلومات قبل مشاركتها', 'في عصر السوشيال ميديا، تنتشر المعلومات بسرعة هائلة. قبل مشاركة أي خبر أو معلومة، تأكد من مصدرها وتحقق من صحتها عبر مصادر موثوقة. الشائعة تُلحق ضرراً بالغاً بالأفراد والمجتمعات. دورك كمواطن رقمي مسؤول أن تتحقق أولاً ثم تشارك.', 'awareness', 'توعية,تحقق,شائعات', 1],
          ['كيف تكتشف الأخبار الزائفة؟', 'هناك عدة علامات تدل على الأخبار الزائفة: عناوين مبالغ فيها، مصادر مجهولة، صور قديمة تُستخدم في سياق مختلف، وغياب التفاصيل الموثوقة. استخدم محركات البحث للتحقق من الأخبار ولجأ إلى المواقع الرسمية للجهات الحكومية والإعلام المعتمد.', 'awareness', 'أخبار زائفة,تحقق', 1],
          ['دور المواطن في مكافحة الشائعات', 'أنت خط الدفاع الأول ضد الشائعات. لا تُشارك ما لم تتحقق منه. أبلغ عن المحتوى المضلل عبر المنصات الرقمية. كن قدوة لمن حولك في التعامل المسؤول مع المعلومات. معاً نستطيع بناء مجتمع رقمي آمن وموثوق.', 'education', 'مسؤولية,مجتمع', 1],
          ['الأثر النفسي للشائعات على الأفراد والمجتمعات', 'تُسبب الشائعات قلقاً واضطراباً نفسياً لدى من يتلقونها، خاصةً في أوقات الأزمات. تعلّم كيف تتعامل مع الأخبار المثيرة للقلق بتهدئة وعقلانية، وتحقق من مصدرها قبل أن تُصدق أو تُشارك. الهدوء والتحقق سلاحك في مواجهة الشائعات.', 'health', 'صحة نفسية,شائعات', 1],
          ['شائعات الصحة: كيف تفرق بين الحقيقة والادعاء؟', 'تنتشر شائعات الصحة كثيراً خاصةً في أوقات الأوبئة. لا تثق في أي وصفة طبية أو ادعاء علاجي لم يصدر من جهة طبية رسمية. استشر طبيبك قبل اتباع أي نصيحة صحية تتداولها منصات التواصل الاجتماعي.', 'health', 'صحة,شائعات طبية', 1],
        ];
        for (const [title, content2, category2, tags, is_published] of starterArticles) {
          await q('INSERT INTO articles (title,content,category,tags,is_published) VALUES (?,?,?,?,?)',
            [title, content2, category2, tags, is_published]).catch(() => {});
        }
      }
    } catch {}

    const articleCols = await getTableColumns('articles');
    const hasCreatedBy = articleCols.has('created_by');
    const hasPublished = articleCols.has('is_published');
    const hasCategory = articleCols.has('category');
    const hasCreatedAt = articleCols.has('created_at');
    const hasArticleId = articleCols.has('article_id');

    let sql = hasCreatedBy
      ? 'SELECT a.*, u.name as author FROM articles a LEFT JOIN users u ON a.created_by=u.user_id WHERE 1=1'
      : 'SELECT a.* FROM articles a WHERE 1=1';
    const p = [];
    if (hasPublished) sql += ' AND a.is_published=1';
    if (category && hasCategory) { sql += ' AND a.category=?'; p.push(category); }
    if (hasCreatedAt) sql += ' ORDER BY a.created_at DESC';
    else if (hasArticleId) sql += ' ORDER BY a.article_id DESC';
    const limitNum = parseInt(limit, 10);
    if (Number.isFinite(limitNum) && limitNum > 0) {
      sql += ` LIMIT ${Math.min(limitNum, 100)}`;
    }
    const rows = await q(sql, p);
    res.json(rows);
  } catch (e) {
    console.error('GET /api/articles error:', e);
    res.status(500).json({ message: 'خطأ', error: e?.message || String(e) || 'unknown_error' });
  }
});

app.post('/api/articles', auth, admin, upload.single('image'), async (req, res) => {
  try {
    const uploadedImg = req.file ? `/uploads/${req.file.filename}` : null;
    const { title, content, category, tags, is_published, image_url, source_name, source_url } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'العنوان والمحتوى مطلوبان' });
    const articleCols = await getTableColumns('articles');
    if (!articleCols.has('title') || !articleCols.has('content')) {
      return res.status(500).json({ message: 'جدول المقالات غير مكتمل: الأعمدة الأساسية غير موجودة' });
    }

    const cols = ['title', 'content'];
    const vals = [title, content];
    const userId = req.user?.userId || req.user?.user_id || null;

    if (articleCols.has('category')) cols.push('category'), vals.push(category || 'awareness');
    if (articleCols.has('tags')) cols.push('tags'), vals.push(tags || null);
    if (articleCols.has('is_published')) cols.push('is_published'), vals.push(parsePublishedFlag(is_published, 1));
    if (articleCols.has('created_by')) cols.push('created_by'), vals.push(userId);
    if (articleCols.has('image_url')) cols.push('image_url'), vals.push(uploadedImg || image_url || null);
    if (articleCols.has('source_name')) cols.push('source_name'), vals.push(source_name || null);
    if (articleCols.has('source_url')) cols.push('source_url'), vals.push(source_url || null);

    const sql = `INSERT INTO articles (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`;
    const result = await q(sql, vals);
    return res.status(201).json({ message: 'تم إضافة المقال', articleId: result.insertId });
  } catch (e) {
    res.status(500).json({ message: 'خطأ في إضافة المقال', error: e.message });
  }
});

app.put('/api/articles/:id', auth, admin, upload.single('image'), async (req, res) => {
  try {
    const uploadedImg = req.file ? `/uploads/${req.file.filename}` : null;
    const { title, content, category, tags, is_published, image_url, source_name, source_url } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'العنوان والمحتوى مطلوبان' });

    const articleCols = await getTableColumns('articles');
    const hasArticleId = articleCols.has('article_id');
    const hasId = articleCols.has('id');
    const pkCol = hasArticleId ? 'article_id' : (hasId ? 'id' : null);
    if (!pkCol) return res.status(500).json({ message: 'تعذر تحديد المفتاح الأساسي لجدول المقالات' });

    const sets = [];
    const vals = [];
    if (articleCols.has('title')) sets.push('title=?'), vals.push(title);
    if (articleCols.has('content')) sets.push('content=?'), vals.push(content);
    if (articleCols.has('category')) sets.push('category=?'), vals.push(category || 'awareness');
    if (articleCols.has('tags')) sets.push('tags=?'), vals.push(tags || null);
    if (articleCols.has('is_published')) sets.push('is_published=?'), vals.push(parsePublishedFlag(is_published, 1));
    if (articleCols.has('source_name')) sets.push('source_name=?'), vals.push(source_name || null);
    if (articleCols.has('source_url')) sets.push('source_url=?'), vals.push(source_url || null);
    if (articleCols.has('image_url') && (uploadedImg || image_url !== undefined)) {
      sets.push('image_url=?');
      vals.push(uploadedImg || image_url || null);
    }

    if (!sets.length) return res.status(400).json({ message: 'لا توجد بيانات للتحديث' });

    vals.push(req.params.id);
    await q(`UPDATE articles SET ${sets.join(',')} WHERE ${pkCol}=?`, vals);
    res.json({ message: 'تم التعديل' });
  } catch (e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.delete('/api/articles/:id', auth, admin, async (req, res) => {
  try { await q('DELETE FROM articles WHERE article_id=?', [req.params.id]); res.json({ message: 'تم الحذف' }); }
  catch (e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

// ─── Videos ───────────────────────────────────────────────────
app.get('/api/videos', async (_req, res) => {
  try {
    const rows = await q('SELECT * FROM awareness_videos ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.post('/api/videos', auth, admin, async (req, res) => {
  try {
    const { title, description, video_url, platform } = req.body;
    if (!title || !video_url) return res.status(400).json({ message: 'العنوان والرابط مطلوبان' });
    const result = await q(
      'INSERT INTO awareness_videos (title,description,video_url,platform) VALUES (?,?,?,?)',
      [title, description || null, video_url, platform || 'youtube']
    );
    res.status(201).json({ message: 'تم الإضافة', videoId: result.insertId });
  } catch (e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.delete('/api/videos/:id', auth, admin, async (req, res) => {
  try { await q('DELETE FROM awareness_videos WHERE video_id=?', [req.params.id]); res.json({ message: 'تم الحذف' }); }
  catch (e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

// ─── Ministries (static) ──────────────────────────────────────
app.get('/api/ministries', async (_req, res) => {
  try {
    const rows = await q(
      'SELECT ministry_id AS id, name, description AS `desc`, website, icon, color FROM ministries WHERE is_active=1 ORDER BY ministry_id ASC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'خطأ في جلب الوزارات', error: e.message });
  }
});

app.post('/api/ministries', auth, admin, async (req, res) => {
  try {
    const { name, desc, website, icon, color } = req.body;
    if (!name || !website) return res.status(400).json({ message: 'الاسم ورابط الموقع مطلوبان' });
    const result = await q(
      'INSERT INTO ministries (name, description, website, icon, color, is_active) VALUES (?,?,?,?,?,1)',
      [name, desc || null, website, icon || '🏛️', color || '#3b82f6']
    );
    res.status(201).json({ message: 'تمت إضافة الوزارة', id: result.insertId });
  } catch (e) {
    if (String(e.message).includes('Duplicate')) {
      return res.status(409).json({ message: 'الوزارة موجودة بالفعل' });
    }
    res.status(500).json({ message: 'خطأ في إضافة الوزارة', error: e.message });
  }
});

// ─── Field Interviews (manual images) ───────────────────────
app.get('/api/field-interviews', async (_req, res) => {
  try {
    await ensureFieldInterviewsTable();
    const rows = await q(
      'SELECT interview_id, title, place, image_url, created_at FROM field_interviews ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ items: rows });
  } catch (e) {
    res.status(500).json({ message: 'خطأ في جلب الصور الميدانية', error: e.message });
  }
});

app.post('/api/field-interviews', auth, admin, upload.single('image'), async (req, res) => {
  try {
    await ensureFieldInterviewsTable();
    const { title, place, image_url } = req.body;
    const uploadedPath = req.file ? `/uploads/${req.file.filename}` : null;
    const finalImageUrl = image_url || uploadedPath;
    if (!title || !finalImageUrl) return res.status(400).json({ message: 'العنوان والصورة مطلوبان (رابط أو ملف)' });
    const userId = req.user?.userId || req.user?.user_id || null;
    const result = await q(
      'INSERT INTO field_interviews (title, place, image_url, created_by) VALUES (?,?,?,?)',
      [title, place || null, finalImageUrl, userId]
    );
    res.status(201).json({ message: 'تمت إضافة الصورة الميدانية', interviewId: result.insertId });
  } catch (e) {
    res.status(500).json({ message: 'خطأ في إضافة الصورة الميدانية', error: e.message });
  }
});

app.delete('/api/field-interviews/:id', auth, admin, async (req, res) => {
  try {
    await ensureFieldInterviewsTable();
    await q('DELETE FROM field_interviews WHERE interview_id=?', [req.params.id]);
    res.json({ message: 'تم حذف الصورة الميدانية' });
  } catch (e) {
    res.status(500).json({ message: 'خطأ في حذف الصورة الميدانية', error: e.message });
  }
});

// ─── Trending Rumors (RSS Aggregator) ────────────────────────
app.get('/api/trending-rumors', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || '20', 10), 50));
    const rumorKeywords = ['شائعة', 'إشاعة', 'تداول', 'مضلل', 'كاذب', 'تحذير', 'عاجل'];

    const reportRumors = await q(
      "SELECT report_id as id, title, created_at, status FROM reports WHERE status IN ('false','rumor','misleading') ORDER BY COALESCE(updated_at, created_at) DESC LIMIT ?",
      [limit]
    ).catch(() => []);

    const articleRumors = await q(
      "SELECT article_id as id, title, created_at FROM articles WHERE category='rumors' OR category='rumor' ORDER BY created_at DESC LIMIT ?",
      [limit]
    ).catch(() => []);

    let items = [
      ...reportRumors.map(r => ({
        id: `report-${r.id}`,
        type: 'report',
        title: r.title,
        status: r.status,
        created_at: r.created_at,
      })),
      ...articleRumors.map(a => ({
        id: `article-${a.id}`,
        type: 'article',
        title: a.title,
        status: 'rumor',
        created_at: a.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, limit);

    // Fallback: if there are no confirmed rumors yet, surface likely rumor-related recent items.
    if (!items.length) {
      const recentReports = await q(
        `SELECT report_id as id, title, created_at, status FROM reports ORDER BY COALESCE(updated_at, created_at) DESC LIMIT ${Math.max(10, limit)}`
      ).catch(() => []);

      const recentRumorLike = recentReports
        .filter(r => {
          const t = String(r.title || '');
          return rumorKeywords.some(k => t.includes(k));
        })
        .slice(0, limit)
        .map(r => ({
          id: `report-${r.id}`,
          type: 'report',
          title: r.title,
          status: r.status || 'pending',
          created_at: r.created_at,
        }));

      items = recentRumorLike;

      if (!items.length && recentReports.length) {
        items = recentReports.slice(0, limit).map(r => ({
          id: `report-${r.id}`,
          type: 'report',
          title: r.title || 'بلاغ قيد المتابعة',
          status: r.status || 'pending',
          created_at: r.created_at,
        }));
      }
    }

    // World events fallback: automatically surface rumor-like global headlines when local data is empty.
    if (!items.length) {
      const worldRumors = await fetchWorldRumors(limit).catch(() => []);
      items = Array.isArray(worldRumors) ? worldRumors : [];
    }

    res.json({ items, total: items.length });
  } catch (e) { res.status(500).json({ message: 'خطأ في جلب الأخبار', error: e.message }); }
});

// ─── Real users/admin data ───────────────────────────────────
app.get('/api/admin/users', auth, admin, async (_req, res) => {
  try {
    const rows = await q(
      'SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 200'
    );
    res.json({ users: rows, total: rows.length });
  } catch (e) {
    res.status(500).json({ message: 'خطأ في جلب المستخدمين', error: e.message });
  }
});

app.put('/api/admin/users/:id/role', auth, admin, async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin', 'reviewer'].includes(role))
    return res.status(400).json({ message: 'دور غير صالح' });
  try {
    await q('UPDATE users SET role=? WHERE user_id=?', [role, req.params.id]);
    res.json({ message: 'تم تحديث الدور بنجاح' });
  } catch (e) {
    res.status(500).json({ message: 'خطأ في تحديث الدور', error: e.message });
  }
});

app.post('/api/articles/sync-real', auth, admin, async (_req, res) => {
  try {
    const result = await syncRealArticlesToDb(true);
    res.json({ message: 'تمت مزامنة المقالات الحقيقية', ...result });
  } catch (e) {
    res.status(500).json({ message: 'فشل مزامنة المقالات', error: e.message });
  }
});

// ─── Admin Dashboard ──────────────────────────────────────────
app.get('/api/dashboard', auth, reportModerator, async (_req, res) => {
  try {
    const statsStartAt = await getStatsStartAt();
    const safeCount = async (sql, params = []) => {
      try {
        const rows = await q(sql, params);
        return Number(rows?.[0]?.total || 0);
      } catch {
        return 0;
      }
    };

    const totalReports  = await safeCount('SELECT COUNT(*) as total FROM reports WHERE created_at >= ?', [statsStartAt]);
    const pendingReports = await safeCount("SELECT COUNT(*) as total FROM reports WHERE created_at >= ? AND status IN ('pending','investigating')", [statsStartAt]);
    const trueReports   = await safeCount("SELECT COUNT(*) as total FROM reports WHERE created_at >= ? AND status IN ('true','fact','partial')", [statsStartAt]);
    const falseReports  = await safeCount("SELECT COUNT(*) as total FROM reports WHERE created_at >= ? AND status IN ('false','rumor','misleading')", [statsStartAt]);
    const totalArticles = await safeCount('SELECT COUNT(*) as total FROM articles WHERE is_published=1');
    const totalSources  = await safeCount('SELECT COUNT(*) as total FROM sources');
    res.json({ totalReports, pendingReports, trueReports, falseReports, totalArticles, totalSources, statsStartAt });
  } catch (e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.get('/api/public-stats', async (_req, res) => {
  try {
    const statsStartAt = await getStatsStartAt();
    const safeCount = async (sql, params = []) => {
      try {
        const rows = await q(sql, params);
        return Number(rows?.[0]?.total || 0);
      } catch {
        return 0;
      }
    };

    const totalReports = await safeCount('SELECT COUNT(*) as total FROM reports WHERE created_at >= ?', [statsStartAt]);
    const pendingReports = await safeCount("SELECT COUNT(*) as total FROM reports WHERE created_at >= ? AND status IN ('pending','investigating')", [statsStartAt]);
    const totalArticles = await safeCount('SELECT COUNT(*) as total FROM articles WHERE is_published=1');
    const totalUsers = await safeCount('SELECT COUNT(*) as total FROM users');
    res.json({ totalReports, pendingReports, totalArticles, totalUsers, statsStartAt });
  } catch (e) { res.status(500).json({ message: 'خطأ', error: e.message }); }
});

app.get('/api/latest-feed', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || '8', 10), 20));
    const reports = await q(`SELECT title, created_at FROM reports ORDER BY COALESCE(updated_at, created_at) DESC LIMIT ${limit}`).catch(() => []);

    let articles = await q(`SELECT title, created_at FROM articles WHERE is_published=1 ORDER BY created_at DESC LIMIT ${limit}`).catch(() => []);
    if (!articles.length) {
      articles = await q(`SELECT title, created_at FROM articles ORDER BY created_at DESC LIMIT ${limit}`).catch(() => []);
    }

    const rumors = await q(`SELECT title, created_at FROM articles WHERE category IN ('rumors','rumor') ORDER BY created_at DESC LIMIT ${limit}`).catch(() => []);

    const items = [
      ...reports.map(r => ({ type: 'report', title: r.title, created_at: r.created_at })),
      ...articles.map(a => ({ type: 'article', title: a.title, created_at: a.created_at })),
      ...rumors.map(r => ({ type: 'rumor', title: r.title, created_at: r.created_at })),
    ]
      .filter(x => x?.title)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, limit);

    res.json({ items, total: items.length });
  } catch (e) {
    res.status(500).json({ message: 'خطأ في جلب الشريط العلوي', error: e.message });
  }
});

app.post('/api/stats/reset-baseline', auth, admin, async (req, res) => {
  try {
    const startAt = req.body?.startAt || new Date().toISOString().slice(0, 19).replace('T', ' ');
    await ensureAppSettingsTable();
    await q(
      'INSERT INTO app_settings (key_name, value_text) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_text=VALUES(value_text)',
      [APP_STATS_BASELINE_KEY, startAt]
    );
    _statsStartAtCache = startAt;
    res.json({ message: 'تمت إعادة ضبط خط بداية الإحصائيات', statsStartAt: startAt });
  } catch (e) {
    res.status(500).json({ message: 'خطأ في إعادة ضبط الإحصائيات', error: e.message });
  }
});

// ── Debug AI endpoint ──────────────────────────────────────────────────────
app.get('/api/test-ai', async (req, res) => {
  const GROQ_KEY = getGroqKey();
  const GEM_KEY  = getGeminiKey();
  const OR_KEY   = getOpenRouterKey();
  const HF_KEY   = process.env.HF_API_TOKEN || '';
  const msgs = [{ role: 'user', content: 'say hello in Arabic in one short sentence' }];
  const results = {
    groq_key: !!GROQ_KEY, gemini_key: !!GEM_KEY, openrouter_key: !!OR_KEY, huggingface_key: !!HF_KEY,
    pollinations: null, huggingface: null, groq: null, gemini: null, openrouter: null,
  };
  results.pollinations = await callPollinations(msgs);
  if (HF_KEY)   results.huggingface = await callHuggingFace(msgs);
  if (OR_KEY)   results.openrouter = await callOpenRouter(msgs, OR_KEY);
  if (GROQ_KEY) results.groq       = await callGroq(msgs, GROQ_KEY);
  if (GEM_KEY)  results.gemini     = await callGemini('say hello in Arabic in one short sentence', GEM_KEY);
  res.json(results);
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
