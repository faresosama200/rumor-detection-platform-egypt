// database.js
const mysql = require('mysql2');
require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env' });

const baseConnection = mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    charset: 'utf8mb4',
});

const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'fake_news_db';

function run(sql, values = []) {
    return new Promise((resolve, reject) => {
        baseConnection.query(sql, values, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function ensureIndex(tableName, indexName, createSql) {
    const rows = await run(
        `SELECT 1 FROM information_schema.statistics WHERE table_schema=? AND table_name=? AND index_name=? LIMIT 1`,
        [dbName, tableName, indexName]
    );
    if (!rows.length) { try { await run(createSql); } catch(e) {} }
}

async function init() {
    console.log('Initializing database...');
    await run(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await run(`USE ${dbName}`);
    await run(`SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'`);

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
        CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await run(`CREATE TABLE IF NOT EXISTS report_evidence (
        evidence_id INT PRIMARY KEY AUTO_INCREMENT,
        report_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        mime_type VARCHAR(120),
        file_size BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_evidence_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await run(`CREATE TABLE IF NOT EXISTS verifications (
        verification_id INT PRIMARY KEY AUTO_INCREMENT,
        report_id INT NOT NULL,
        reviewer_id INT NULL,
        verdict ENUM('true','false') NOT NULL,
        reason TEXT,
        source_id INT NULL,
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_verification_report (report_id),
        CONSTRAINT fk_verification_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
        CONSTRAINT fk_verification_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE SET NULL,
        CONSTRAINT fk_verification_source FOREIGN KEY (source_id) REFERENCES sources(source_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await run(`CREATE TABLE IF NOT EXISTS articles (
        article_id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NOT NULL,
        category VARCHAR(120) DEFAULT 'awareness',
        tags VARCHAR(255),
        is_published TINYINT(1) DEFAULT 1,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_articles_user FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await run(`CREATE TABLE IF NOT EXISTS report_reviews (
        review_id INT PRIMARY KEY AUTO_INCREMENT,
        report_id INT NOT NULL,
        reviewer_id INT NULL,
        admin_id INT NULL,
        spokesperson_id INT NULL,
        reviewer_comment TEXT,
        reviewer_status ENUM('pending','approved','rejected') DEFAULT 'pending',
        admin_comment TEXT,
        admin_status ENUM('pending','approved','rejected') DEFAULT 'pending',
        spokesperson_comment TEXT,
        spokesperson_status ENUM('pending','approved','rejected') DEFAULT 'pending',
        final_verdict ENUM('true','false','unverified') DEFAULT 'unverified',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_review_report (report_id),
        CONSTRAINT fk_review_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
        CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE SET NULL,
        CONSTRAINT fk_review_admin FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE SET NULL,
        CONSTRAINT fk_review_spokesperson FOREIGN KEY (spokesperson_id) REFERENCES users(user_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await run(`CREATE TABLE IF NOT EXISTS external_links_config (
        link_id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL,
        url VARCHAR(500) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'Egypt',
        link_type ENUM('government','media','health','security','news','other') DEFAULT 'other',
        icon VARCHAR(50),
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await run(`CREATE TABLE IF NOT EXISTS awareness_videos (
        video_id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        platform VARCHAR(50) DEFAULT 'youtube',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await ensureIndex('reports','idx_reports_status_created','CREATE INDEX idx_reports_status_created ON reports (status,created_at)');
    await ensureIndex('reports','idx_reports_category_created','CREATE INDEX idx_reports_category_created ON reports (category,created_at)');
    await ensureIndex('articles','idx_articles_published_created','CREATE INDEX idx_articles_published_created ON articles (is_published,created_at)');

    await run(`INSERT INTO sources (source_name,source_url,credibility_score,notes) SELECT * FROM (SELECT 'وزارة الداخلية المصرية','https://www.moig.gov.eg',95,'الجهاز الأمني') AS t WHERE NOT EXISTS (SELECT 1 FROM sources WHERE source_url='https://www.moig.gov.eg')`);
    await run(`INSERT INTO sources (source_name,source_url,credibility_score,notes) SELECT * FROM (SELECT 'وزارة الصحة المصرية','https://www.mohp.gov.eg',93,'جهة الصحة الرسمية') AS t WHERE NOT EXISTS (SELECT 1 FROM sources WHERE source_url='https://www.mohp.gov.eg')`);
    await run(`INSERT INTO articles (title,content,category,tags) SELECT * FROM (SELECT 'كيف تتحقق من الأخبار قبل مشاركتها؟','تحقق من المصدر، قارن الخبر في أكثر من جهة موثوقة، وابتعد عن العناوين المثيرة.','awareness','تحقق,مصادر,توعية') AS t WHERE NOT EXISTS (SELECT 1 FROM articles WHERE title='كيف تتحقق من الأخبار قبل مشاركتها؟')`);

    const bcrypt = require('bcryptjs');
    const adminHash = await bcrypt.hash('admin123', 10);
    await run(`INSERT INTO users (name,email,password_hash,role) SELECT * FROM (SELECT 'مدير النظام','admin@platform.com',?,'admin') AS t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='admin@platform.com')`, [adminHash]);
    const reviewerHash = await bcrypt.hash('reviewer123', 10);
    await run(`INSERT INTO users (name,email,password_hash,role) SELECT * FROM (SELECT 'مراجع المحتوى','reviewer@platform.com',?,'reviewer') AS t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='reviewer@platform.com')`, [reviewerHash]);
    const spokespersonHash = await bcrypt.hash('spokesperson123', 10);
    await run(`INSERT INTO users (name,email,password_hash,role) SELECT * FROM (SELECT 'المتحدث الإعلامي المصري','spokesperson@platform.com',?,'spokesperson') AS t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='spokesperson@platform.com')`, [spokespersonHash]);

    console.log('Database initialized successfully.');
    baseConnection.end();
}

init().catch((error) => {
    console.error('Database init failed:', error.message);
    baseConnection.end();
    process.exit(1);
});
