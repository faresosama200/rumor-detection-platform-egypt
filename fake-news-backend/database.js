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
  return new Promise((resolve, reject) => {
    conn.query(sql, vals, (err, r) => (err ? reject(err) : resolve(r)));
  });
}

async function init() {
  console.log('Initializing DB...');
  await run(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await run(`USE \`${dbName}\``);
  await run("SET NAMES 'utf8mb4'");

  await run(`CREATE TABLE IF NOT EXISTS users (
    user_id      INT PRIMARY KEY AUTO_INCREMENT,
    name         VARCHAR(120) NOT NULL,
    email        VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role         ENUM('user','reviewer','admin','spokesperson') DEFAULT 'user',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await run(`CREATE TABLE IF NOT EXISTS sources (
    source_id        INT PRIMARY KEY AUTO_INCREMENT,
    source_name      VARCHAR(200) NOT NULL,
    source_url       VARCHAR(500) NOT NULL,
    credibility_score INT DEFAULT 50,
    notes            TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await run(`CREATE TABLE IF NOT EXISTS reports (
    report_id   INT PRIMARY KEY AUTO_INCREMENT,
    user_id     INT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    source_url  VARCHAR(500),
    category    VARCHAR(120) DEFAULT 'general',
    tags        VARCHAR(255),
    status      ENUM('pending','true','false') DEFAULT 'pending',
    admin_notes TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rep_usr FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await run(`CREATE TABLE IF NOT EXISTS report_evidence (
    evidence_id INT PRIMARY KEY AUTO_INCREMENT,
    report_id   INT NOT NULL,
    file_name   VARCHAR(255) NOT NULL,
    file_path   VARCHAR(500) NOT NULL,
    mime_type   VARCHAR(120),
    file_size   BIGINT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ev_rep FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await run(`CREATE TABLE IF NOT EXISTS articles (
    article_id  INT PRIMARY KEY AUTO_INCREMENT,
    title       VARCHAR(255) NOT NULL,
    content     LONGTEXT NOT NULL,
    category    VARCHAR(120) DEFAULT 'awareness',
    tags        VARCHAR(255),
    is_published TINYINT(1) DEFAULT 1,
    created_by  INT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_art_usr FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await run(`CREATE TABLE IF NOT EXISTS awareness_videos (
    video_id    INT PRIMARY KEY AUTO_INCREMENT,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    video_url   VARCHAR(500) NOT NULL,
    platform    ENUM('youtube','facebook','tiktok','other') DEFAULT 'youtube',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await run(`CREATE TABLE IF NOT EXISTS verifications (
    verification_id INT PRIMARY KEY AUTO_INCREMENT,
    report_id   INT NOT NULL,
    reviewer_id INT NULL,
    verdict     ENUM('true','false') NOT NULL,
    reason      TEXT,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ver_rep (report_id),
    CONSTRAINT fk_ver_rep FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
    CONSTRAINT fk_ver_rev FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Seed admin
  const { default: bcryptjs } = await import('bcryptjs');
  const hash = await bcryptjs.hash('admin123', 10);
  await run(`INSERT IGNORE INTO users (name,email,password_hash,role) VALUES ('مدير النظام','admin@platform.com',?,?)`, [hash, 'admin']);

  // Seed demo articles
  await run(`INSERT IGNORE INTO articles (title,content,category,is_published,created_by) VALUES
    ('كيف تتعرف على الأخبار الزائفة','تعلم الخطوات العملية للتحقق من المعلومات قبل مشاركتها.','awareness',1,1),
    ('الشائعات وأثرها على المجتمع','دراسة في تأثير المعلومات المضللة على القرارات اليومية.','education',1,1)
  `);

  console.log('DB initialized successfully.');
  conn.end();
}

init().catch(e => { console.error(e); conn.end(); process.exit(1); });
