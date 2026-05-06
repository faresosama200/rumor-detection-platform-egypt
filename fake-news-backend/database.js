// database.js
const mysql = require('mysql2');
require('dotenv').config();
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway';
const conn = mysql.createConnection({
  host:     process.env.DB_HOST     || process.env.MYSQLHOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
  user:     process.env.DB_USER     || process.env.MYSQLUSER     || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  charset:  'utf8mb4',
  multipleStatements: true,
});
function run(sql, vals = []) {
  return new Promise((res, rej) => conn.query(sql, vals, (e, r) => e ? rej(e) : res(r)));
}

function closeConnSafe() {
  try {
    if (conn && conn.connection && conn.connection.stream && !conn.connection.stream.destroyed) {
      conn.end();
    }
  } catch {}
}

async function init() {
  console.log('Initializing DB...');
  await run(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await run(`USE \`${dbName}\``);
  await run("SET NAMES 'utf8mb4'");

  await run(`CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user','reviewer','admin','spokesperson') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await run(`CREATE TABLE IF NOT EXISTS sources (
    source_id INT PRIMARY KEY AUTO_INCREMENT,
    source_name VARCHAR(200) NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    credibility_score INT DEFAULT 50,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await run(`CREATE TABLE IF NOT EXISTS reports (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    source_url VARCHAR(500),
    category VARCHAR(120) DEFAULT 'general',
    tags VARCHAR(255),
    status ENUM('pending','true','false') DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rep_usr FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await run(`CREATE TABLE IF NOT EXISTS report_evidence (
    evidence_id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(120),
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ev_rep FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await run(`CREATE TABLE IF NOT EXISTS articles (
    article_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    category VARCHAR(120) DEFAULT 'awareness',
    tags VARCHAR(255),
    is_published TINYINT(1) DEFAULT 1,
    created_by INT NULL,
    source_name VARCHAR(200) NULL,
    source_url VARCHAR(500) NULL,
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_art_usr FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Add image_url column if missing
  try { await run('ALTER TABLE articles ADD COLUMN image_url VARCHAR(500) NULL'); } catch {}
  try { await run('ALTER TABLE articles ADD COLUMN source_name VARCHAR(200) NULL'); } catch {}
  try { await run('ALTER TABLE articles ADD COLUMN source_url VARCHAR(500) NULL'); } catch {}

  await run(`CREATE TABLE IF NOT EXISTS ministries (
    ministry_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    website VARCHAR(500) NOT NULL,
    icon VARCHAR(20) DEFAULT '🏛️',
    color VARCHAR(20) DEFAULT '#3b82f6',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await run(`CREATE TABLE IF NOT EXISTS awareness_videos (
    video_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    platform ENUM('youtube','facebook','tiktok','other') DEFAULT 'youtube',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await run(`CREATE TABLE IF NOT EXISTS verifications (
    verification_id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    reviewer_id INT NULL,
    verdict ENUM('true','false') NOT NULL,
    reason TEXT,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ver_rep (report_id),
    CONSTRAINT fk_ver_rep FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
    CONSTRAINT fk_ver_rev FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Seed admin
  const { default: bcryptjs } = await import('bcryptjs');
  const hash = await bcryptjs.hash('admin123', 10);
  await run(`INSERT IGNORE INTO users (name,email,password_hash,role) VALUES ('د. عبد الوهاب','admin@platform.com',?,?)`, [hash, 'admin']);

  // Seed trusted RSS/news sources
  const trustedSources = [
    ['اليوم السابع', 'https://www.youm7.com/rss/rssfeeds.aspx?sectionid=65', 80, 'مصدر محلي واسع الانتشار'],
    ['مصراوي', 'https://www.masrawy.com/rss/news', 78, 'مصدر إخباري مصري'],
    ['الشروق', 'https://www.shorouknews.com/rss/view.aspx?cdate=today', 76, 'مصدر إخباري مصري'],
    ['الأهرام', 'https://gate.ahram.org.eg/rss', 82, 'بوابة رسمية معروفة'],
    ['BBC عربي', 'https://feeds.bbci.co.uk/arabic/rss.xml', 85, 'مصدر دولي موثوق'],
    ['سكاي نيوز عربية', 'https://www.skynewsarabia.com/web/rss/2-1', 79, 'مصدر إقليمي موثوق'],
  ];
  for (const s of trustedSources) {
    await run(
      'INSERT IGNORE INTO sources (source_name, source_url, credibility_score, notes) VALUES (?,?,?,?)',
      s
    );
  }

  // Seed ministries (official entities)
  const ministries = [
    ['وزارة الصحة والسكان', 'الجهة المسؤولة عن الشؤون الصحية في مصر', 'https://www.mohp.gov.eg', '🏥', '#e74c3c'],
    ['وزارة التربية والتعليم والتعليم الفني', 'الإشراف على العملية التعليمية في جميع مراحلها', 'https://moe.gov.eg', '🏫', '#3498db'],
    ['وزارة التعليم العالي والبحث العلمي', 'الجامعات والمعاهد والبحث العلمي', 'https://mohesr.gov.eg', '🎓', '#2980b9'],
    ['وزارة الداخلية', 'الأمن الوطني والخدمات المدنية', 'https://www.moiegypt.gov.eg', '🔒', '#2c3e50'],
    ['وزارة الخارجية والهجرة', 'العلاقات الدبلوماسية والشؤون الخارجية', 'https://mfa.gov.eg', '🌍', '#1a5276'],
    ['وزارة العدل', 'شؤون القضاء والتشريع والتوثيق', 'https://moj.gov.eg', '⚖️', '#8e44ad'],
    ['وزارة المالية', 'السياسة المالية والاقتصادية والضرائب', 'https://mof.gov.eg', '💰', '#f39c12'],
    ['وزارة الاتصالات وتكنولوجيا المعلومات', 'تطوير البنية التحتية الرقمية والتحول الرقمي', 'https://mcit.gov.eg', '💻', '#16a085'],
    ['وزارة الشباب والرياضة', 'رعاية الشباب والأنشطة الرياضية', 'https://youth.gov.eg', '⚽', '#27ae60'],
    ['وزارة الثقافة', 'الإشراف على الشؤون الثقافية والفنون', 'https://www.moc.gov.eg', '🎭', '#d35400'],
    ['وزارة التضامن الاجتماعي', 'الرعاية الاجتماعية ودعم الأسرة', 'https://www.moss.gov.eg', '🤝', '#c0392b'],
    ['وزارة الأوقاف', 'الشؤون الدينية الإسلامية والمساجد', 'https://www.awkaf.gov.eg', '🕌', '#1a5276'],
    ['وزارة الزراعة واستصلاح الأراضي', 'شؤون الزراعة والأمن الغذائي', 'https://moa.gov.eg', '🌾', '#2ecc71'],
    ['وزارة السياحة والآثار', 'قطاع السياحة وصون الموروث الحضاري', 'https://egymonuments.gov.eg', '🏺', '#e67e22'],
    ['وزارة النقل', 'شؤون السكك الحديدية والطرق والنقل', 'https://www.mot.gov.eg', '🚆', '#34495e'],
    ['وزارة التموين والتجارة الداخلية', 'الأمن الغذائي وضبط الأسواق', 'https://www.msit.gov.eg', '🛒', '#7f8c8d'],
  ];
  for (const m of ministries) {
    await run(
      'INSERT IGNORE INTO ministries (name, description, website, icon, color) VALUES (?,?,?,?,?)',
      m
    );
  }

  console.log('✅ DB initialized successfully.');
  closeConnSafe();
}
init().catch(e => {
  console.error(e);
  closeConnSafe();
  process.exit(1);
});
