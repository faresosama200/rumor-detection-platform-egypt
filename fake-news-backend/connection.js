const mysql = require('mysql2');
require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env' });

const db = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'fake_news_db',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// ضمان ترميز UTF-8 لكل اتصال جديد
db.on('connection', (conn) => {
    conn.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
    conn.query("SET CHARACTER SET utf8mb4");
});

const query = (sql, values = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, values, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });

module.exports = { db, query };
