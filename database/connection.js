// تم نقل ملف قاعدة البيانات هنا من أجل التنظيم
// يمكنك تعديل إعدادات الاتصال من هذا الملف

const mysql = require('mysql2');
require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env' });

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fake_news_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

const query = (sql, values = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, values, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });

module.exports = { db, qu