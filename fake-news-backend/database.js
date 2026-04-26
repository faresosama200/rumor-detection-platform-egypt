// تم نقل الكود إلى ../database/connection.js
const mysql = require('mysql2');
require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env' });

const baseConnection = mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    charset: 'utf8mb4',
});

const dbName = process.env.DB_NAME || 'fake_news_db';

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
        `SELECT 1
         FROM information_schema.statistics
         WHERE table_schema = ? AND table_name = ? AND index_name = ?
         LIMIT 1`,
        [dbName, tableName, indexName]
    );

    if (!rows.length) {
        await run(createSql);
    }
}

async function init() {
    console.log('Initializing database...');

    await run(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await run(`USE ${dbName}`);
    await run(`SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'`);
    await run(`SET CHARACTER SET utf8mb4`);

        // حذف البلاغات القديمة التي تم تخزين عناوينها كعلامات استفهام بسبب ترميز خاطئ
        await run(`
                DELETE re FROM report_evidence re
                INNER JOIN reports r ON re.report_id = r.report_id
                WHERE r.title LIKE '%?%'
                    AND r.title REGEXP '^[ ?]+$'
        `);

        await run(`
                DELETE v FROM verifications v
                INNER JOIN reports r ON v.report_id = r.report_id
                WHERE r.title LIKE '%?%'
                    AND r.title REGEXP '^[ ?]+$'
        `);

        await run(`
                DELETE rr FROM report_reviews rr
                INNER JOIN reports r ON rr.report_id = r.report_id
                WHERE r.title LIKE '%?%'
                    AND r.title REGEXP '^[ ?]+$'
        `);

        await run(`
                DELETE FROM reports
                WHERE title LIKE '%?%'
                    AND title REGEXP '^[ ?]+$'
        `);

    await run(`
        CREATE TABLE IF NOT EXISTS users (
            user_id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(160) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('user', 'reviewer', 'admin', 'spokesperson') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS sources (
            source_id INT PRIMARY KEY AUTO_INCREMENT,
            source_name VARCHAR(200) NOT NULL,
            source_url VARCHAR(500) NOT NULL,
            credibility_score INT DEFAULT 50,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS reports (
            report_id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            source_url VARCHAR(500),
            category VARCHAR(120) DEFAULT 'general',
            tags VARCHAR(255),
            status ENUM('pending', 'true', 'false') DEFAULT 'pending',
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_reports_user FOREIGN KEY (user_id)
                REFERENCES users(user_id)
                ON DELETE SET NULL
        ) ENGINE=InnoDB
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS report_evidence (
            evidence_id INT PRIMARY KEY AUTO_INCREMENT,
            report_id INT NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            mime_type VARCHAR(120),
            file_size BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_evidence_report FOREIGN KEY (report_id)
                REFERENCES reports(report_id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS verifications (
            verification_id INT PRIMARY KEY AUTO_INCREMENT,
            report_id INT NOT NULL,
            reviewer_id INT NULL,
            verdict ENUM('true', 'false') NOT NULL,
            reason TEXT,
            source_id INT NULL,
            verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_verification_report (report_id),
            CONSTRAINT fk_verification_report FOREIGN KEY (report_id)
                REFERENCES reports(report_id)
                ON DELETE CASCADE,
            CONSTRAINT fk_verification_reviewer FOREIGN KEY (reviewer_id)
                REFERENCES users(user_id)
                ON DELETE SET NULL,
            CONSTRAINT fk_verification_source FOREIGN KEY (source_id)
                REFERENCES sources(source_id)
                ON DELETE SET NULL
        ) ENGINE=InnoDB
    `);

    await run(`
        DELETE v1
        FROM verifications v1
        INNER JOIN verifications v2
            ON v1.report_id = v2.report_id
            AND v1.verification_id < v2.verification_id
    `);

    await ensureIndex('reports', 'idx_reports_status_created', 'CREATE INDEX idx_reports_status_created ON reports (status, created_at)');
    await ensureIndex('reports', 'idx_reports_category_created', 'CREATE INDEX idx_reports_category_created ON reports (category, created_at)');
    await ensureIndex('reports', 'idx_reports_created_at', 'CREATE INDEX idx_reports_created_at ON reports (created_at)');
    await ensureIndex('articles', 'idx_articles_published_created', 'CREATE INDEX idx_articles_published_created ON articles (is_published, created_at)');
    await ensureIndex('sources', 'idx_sources_credibility', 'CREATE INDEX idx_sources_credibility ON sources (credibility_score)');
    await ensureIndex('verifications', 'uq_verification_report', 'ALTER TABLE verifications ADD UNIQUE INDEX uq_verification_report (report_id)');

    await run(`
        CREATE TABLE IF NOT EXISTS articles (
            article_id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            content LONGTEXT NOT NULL,
            category VARCHAR(120) DEFAULT 'awareness',
            tags VARCHAR(255),
            is_published TINYINT(1) DEFAULT 1,
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_articles_user FOREIGN KEY (created_by)
                REFERENCES users(user_id)
                ON DELETE SET NULL
        ) ENGINE=InnoDB
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS report_reviews (
            review_id INT PRIMARY KEY AUTO_INCREMENT,
            report_id INT NOT NULL,
            reviewer_id INT NULL,
            admin_id INT NULL,
            spokesperson_id INT NULL,
            reviewer_comment TEXT,
            reviewer_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            admin_comment TEXT,
            admin_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            spokesperson_comment TEXT,
            spokesperson_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            final_verdict ENUM('true', 'false', 'unverified') DEFAULT 'unverified',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_review_report (report_id),
            CONSTRAINT fk_review_report FOREIGN KEY (report_id)
                REFERENCES reports(report_id)
                ON DELETE CASCADE,
            CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id)
                REFERENCES users(user_id)
                ON DELETE SET NULL,
            CONSTRAINT fk_review_admin FOREIGN KEY (admin_id)
                REFERENCES users(user_id)
                ON DELETE SET NULL,
            CONSTRAINT fk_review_spokesperson FOREIGN KEY (spokesperson_id)
                REFERENCES users(user_id)
                ON DELETE SET NULL
        ) ENGINE=InnoDB
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS external_links_config (
            link_id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(200) NOT NULL,
            url VARCHAR(500) NOT NULL,
            description TEXT,
            category VARCHAR(100) DEFAULT 'Egypt',
            link_type ENUM('government', 'media', 'health', 'security', 'news', 'other') DEFAULT 'other',
            icon VARCHAR(50),
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    `);

    await run(
        `INSERT INTO sources (source_name, source_url, credibility_score, notes)
         SELECT * FROM (
            SELECT 'Saudi Press Agency', 'https://www.spa.gov.sa', 90, 'Official state source'
         ) AS tmp
         WHERE NOT EXISTS (SELECT 1 FROM sources WHERE source_url = 'https://www.spa.gov.sa')`
    );

    await run(
        `INSERT INTO sources (source_name, source_url, credibility_score, notes)
         SELECT * FROM (
            SELECT 'وزارة الداخلية المصرية', 'https://www.moig.gov.eg', 95, 'الجهاز الأمني المصري الرسمي'
         ) AS tmp
         WHERE NOT EXISTS (SELECT 1 FROM sources WHERE source_url = 'https://www.moig.gov.eg')`
    );

    await run(
        `INSERT INTO sources (source_name, source_url, credibility_score, notes)
         SELECT * FROM (
            SELECT 'وزارة الصحة المصرية', 'https://www.mohp.gov.eg', 93, 'جهة الصحة الرسمية في مصر'
         ) AS tmp
         WHERE NOT EXISTS (SELECT 1 FROM sources WHERE source_url = 'https://www.mohp.gov.eg')`
    );

    await run(
        `INSERT INTO sources (source_name, source_url, credibility_score, notes)
         SELECT * FROM (
            SELECT 'جريدة الوطن المصرية', 'https://www.elwatannews.com', 85, 'وسيلة إعلام مصرية رسمية'
         ) AS tmp
         WHERE NOT EXISTS (SELECT 1 FROM sources WHERE source_url = 'https://www.elwatannews.com')`
    );

    await run(`
        INSERT INTO external_links_config (name, url, description, category, link_type, icon)
         SELECT * FROM (
            SELECT 
                'وزارة الداخلية المصرية',
                'https://www.moig.gov.eg',
                'الموقع الرسمي لوزارة الداخلية لعرض البيانات الأمنية الرسمية',
                'Egypt',
                'government',
                '🏛️'
         ) AS tmp
         WHERE NOT EXISTS (SELECT 1 FROM external_links_config WHERE url = 'https://www.moig.gov.eg')
    `);

    await run(`
        INSERT INTO external_links_config (name, url, description, category, link_type, icon)
         SELECT * FROM (
            SELECT 
                'وزارة الصحة والسكان المصرية',
                'https://www.mohp.gov.eg',
                'الموقع الرسمي لوزارة الصحة لتأكيد المعلومات الصحية',
                'Egypt',
                'health',
                '⚕️'
         ) AS tmp
         WHERE NOT EXISTS (SELECT 1 FROM external_links_config WHERE url = 'https://www.mohp.gov.eg')
    `);

    await run(`
        INSERT INTO external_links_config (name, url, description, category, link_type, icon)
         SELECT * FROM (
            SELECT 
                'منظمة الصحة العالمية (WHO)',
                'https://www.who.int/ar',
                'الموقع الرسمي للصحة العالمية للمعلومات الصحية الدولية',
                'World',
                'health',
                '🌍'
         ) AS tmp
         WHERE NOT EXISTS (SELECT 1 FROM external_links_config WHERE url = 'https://www.who.int/ar')
    `);

    await run(`
        INSERT INTO external_links_config (name, url, description, category, link_type, icon)
         SELECT * FROM (
            SELECT 
                'جريدة الوطن المصرية',
                'https://www.elwatannews.com',
                'الجريدة الرسمية المصرية',
                'Egypt',
                'media',
                '📰'
         ) AS tmp
         WHERE NOT EXISTS (SELECT 1 FROM external_links_config WHERE url = 'https://www.elwatannews.com')
    `);

    await run(`
        INSERT INTO external_links_config (name, url, description, category, link_type, icon)
         SELECT * FROM (
            SELECT 
                'وكالة الأنباء الرسمية المصرية (MENA)',
                'https://www.mena.org.eg',
                'الوكالة الرسمية للأنباء المصرية',
                'Egypt',
                'news',
                '📡'
         ) AS tmp
         WHERE NOT EXISTS (SELECT 1 FROM external_links_config WHERE url = 'https://www.mena.org.eg')
    `);

    await run(
        `INSERT INTO articles (title, content, category, tags)
         SELECT * FROM (
            SELECT
            'كيف تتحقق من الأخبار قبل مشاركتها؟',
            'تحقق من المصدر، قارن الخبر في أكثر من جهة موثوقة، وابتعد عن العناوين المثيرة.',
            'awareness',
            'تحقق,مصادر,توعية'
         ) AS tmp
         WHERE NOT EXISTS (SELECT 1 FROM articles WHERE title = 'كيف تتحقق من الأخبار قبل مشاركتها؟')`
    );

     await run(
          `INSERT INTO reports (title, description, source_url, category, tags, status)
            SELECT * FROM (
                SELECT
                'شائعة عن فيروس صحي في مصر',
                'انتشرت شائعة تدعي وجود فيروس خطير جديد في مصر وهذا غير مؤكد من الجهات الرسمية.',
                NULL,
                'health',
                'صحة,فيروس,شائعة',
                'pending'
            ) AS tmp
            WHERE NOT EXISTS (SELECT 1 FROM reports WHERE title = 'شائعة عن فيروس صحي في مصر')`
     );

     await run(
          `INSERT INTO reports (title, description, source_url, category, tags, status)
            SELECT * FROM (
                SELECT
                'شائعة عن قرار اقتصادي',
                'شائعة تزعم صدور قرار اقتصادي مهم دون إعلان رسمي من الجهات المختصة.',
                NULL,
                'economy',
                'اقتصاد,قرار,شائعة',
                'pending'
            ) AS tmp
            WHERE NOT EXISTS (SELECT 1 FROM reports WHERE title = 'شائعة عن قرار اقتصادي')`
     );

     await run(
          `INSERT INTO reports (title, description, source_url, category, tags, status)
            SELECT * FROM (
                SELECT
                'معلومة مضللة عن السياسة',
                'معلومة مضللة تتعلق بقرار سياسي لم يصدر رسميا حتى الآن.',
                NULL,
                'politics',
                'سياسة,قرار,مضللة',
                'pending'
            ) AS tmp
            WHERE NOT EXISTS (SELECT 1 FROM reports WHERE title = 'معلومة مضللة عن السياسة')`
     );

    const bcrypt = require('bcryptjs');
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await run(
        `INSERT INTO users (name, email, password_hash, role)
         SELECT * FROM (
            SELECT 'مدير النظام', 'admin@platform.com', ?, 'admin'
         ) AS tmp
         WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@platform.com')`,
        [adminPasswordHash]
    );

    const reviewerPasswordHash = await bcrypt.hash('reviewer123', 10);
    await run(
        `INSERT INTO users (name, email, password_hash, role)
         SELECT * FROM (
            SELECT 'مراجع المحتوى', 'reviewer@platform.com', ?, 'reviewer'
         ) AS tmp
         WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'reviewer@platform.com')`,
        [reviewerPasswordHash]
    );

    const spokespersonPasswordHash = await bcrypt.hash('spokesperson123', 10);
    await run(
        `INSERT INTO users (name, email, password_hash, role)
         SELECT * FROM (
            SELECT 'المتحدث الإعلامي المصري', 'spokesperson@platform.com', ?, 'spokesperson'
         ) AS tmp
         WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'spokesperson@platform.com')`,
        [spokespersonPasswordHash]
    );

    console.log('Database initialized successfully.');
    baseConnection.end();
}

init().catch((error) => {
    console.error('Database init failed:', error.message);
    baseConnection.end();
    process.exit(1);
});
