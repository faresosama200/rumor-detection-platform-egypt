# 🔧 البنية التقنية للنظام - دليل المطورين

## 📐 معمارية النظام

```
┌─────────────────────────────────────────────────────────────┐
│                      الواجهة الأمامية (Frontend)            │
│  React + Vite | RTL Support | Arabic Localization          │
├─────────────────────────────────────────────────────────────┤
│  Components:                                                │
│  ├─ ReportReviewSystem.jsx (نظام مراجعة البلاغات)          │
│  ├─ ExternalLinksPage.jsx (الروابط الموثوقة)               │
│  ├─ AdminDashboard.jsx (لوحة التحكم)                       │
│  ├─ App.jsx (التوجيه الرئيسي)                              │
│  └─ auth.jsx (نظام المصادقة)                               │
├─────────────────────────────────────────────────────────────┤
│                      Backend (Node.js + Express)           │
│         RESTful APIs | MySQL | JWT Authentication         │
├─────────────────────────────────────────────────────────────┤
│                      قاعدة البيانات (MySQL)                │
│  ├─ reports (البلاغات الأصلية)                             │
│  ├─ report_reviews (سجل المراجعات الثلاثية)               │
│  ├─ users (المستخدمون والأدوار)                           │
│  ├─ articles (المقالات التوعوية)                          │
│  ├─ sources (المصادر الموثوقة)                            │
│  └─ external_links_config (الروابط الخارجية)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ جداول قاعدة البيانات الجديدة

### 1. جدول `report_reviews`
```sql
CREATE TABLE report_reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL UNIQUE,
    reviewer_id INT NULL,
    admin_id INT NULL,
    spokesperson_id INT NULL,
    
    -- تقييم المراجع
    reviewer_comment TEXT,
    reviewer_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    
    -- تقييم المدير
    admin_comment TEXT,
    admin_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    
    -- تقييم المتحدث الإعلامي
    spokesperson_comment TEXT,
    spokesperson_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    
    -- النتيجة النهائية
    final_verdict ENUM('true', 'false', 'unverified') DEFAULT 'unverified',
    
    -- التتبع الزمني
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- العلاقات
    CONSTRAINT fk_review_report FOREIGN KEY (report_id)
        REFERENCES reports(report_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_review_admin FOREIGN KEY (admin_id)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_review_spokesperson FOREIGN KEY (spokesperson_id)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB
```

### 2. جدول `external_links_config`
```sql
CREATE TABLE external_links_config (
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
```

### 3. تحديث جدول `users`
```sql
-- تم إضافة دور جديد
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'reviewer', 'admin', 'spokesperson') DEFAULT 'user';
```

---

## 🔌 API Endpoints الجديدة

### نظام البلاغات المتقدم

#### `GET /api/reports-with-reviews`
**الغرض:** الحصول على جميع البلاغات مع حالات المراجعة

**المعاملات:**
```
?status=true|false|unverified
?limit=50
```

**الاستجابة:**
```json
{
  "count": 10,
  "reports": [
    {
      "report_id": 1,
      "title": "عنوان البلاغ",
      "description": "التفاصيل",
      "category": "صحة",
      "report_status": "pending",
      "created_at": "2026-04-26T10:00:00Z",
      "reporter_name": "أحمد محمد",
      "review_id": 1,
      "reviewer_status": "approved",
      "admin_status": "pending",
      "spokesperson_status": "pending",
      "final_verdict": "unverified",
      "reviewer_comment": "هذا البلاغ موثوق",
      "admin_comment": null,
      "spokesperson_comment": null
    }
  ]
}
```

---

#### `POST /api/reports/:id/review`
**الغرض:** إنشاء أو تحديث مراجعة بلاغ

**البيانات المرسلة:**
```json
{
  "reviewerId": 2,
  "adminId": 3,
  "spokespersonId": 4
}
```

**الاستجابة:**
```json
{
  "message": "review created/updated",
  "reportId": 1
}
```

---

#### `PUT /api/reports/:id/reviewer-assessment`
**الغرض:** تقديم تقييم المراجع

**البيانات المرسلة:**
```json
{
  "reviewerId": 2,
  "comment": "هذا البلاغ يحتاج تحقق إضافي",
  "status": "approved|rejected|pending"
}
```

---

#### `PUT /api/reports/:id/admin-assessment`
**الغرض:** تقديم تقييم المدير

**البيانات المرسلة:**
```json
{
  "adminId": 3,
  "comment": "موافق على رأي المراجع",
  "status": "approved|rejected|pending"
}
```

---

#### `PUT /api/reports/:id/spokesperson-assessment`
**الغرض:** إصدار الحكم النهائي من المتحدث

**البيانات المرسلة:**
```json
{
  "spokespersonId": 4,
  "comment": "بناءً على التحقيقات الرسمية، هذا الخبر كاذب",
  "status": "approved|rejected|pending",
  "finalVerdict": "true|false|unverified"
}
```

---

#### `GET /api/reports/:id/full-review`
**الغرض:** الحصول على البيانات الكاملة للبلاغ مع المراجعات

**الاستجابة:**
```json
{
  "report": { /* بيانات البلاغ */ },
  "evidence": [ /* الملفات المرفقة */ ],
  "review": { /* بيانات المراجعة */ },
  "reviewerInfo": { "user_id": 2, "name": "محمد علي" },
  "adminInfo": { "user_id": 3, "name": "أحمد سلام" },
  "spokespersonInfo": { "user_id": 4, "name": "محمد السيد" }
}
```

---

#### `GET /api/external-links`
**الغرض:** الحصول على الروابط الخارجية النشطة

**الاستجابة:**
```json
{
  "links": [
    {
      "link_id": 1,
      "name": "وزارة الداخلية المصرية",
      "url": "https://www.moig.gov.eg",
      "description": "الموقع الرسمي...",
      "category": "حكومي مصري",
      "link_type": "government",
      "icon": "🏛️"
    }
  ]
}
```

---

#### `PUT /api/articles/:id`
**الغرض:** تحديث مقالة (مع المزامنة التلقائية)

**البيانات المرسلة:**
```json
{
  "title": "عنوان المقالة",
  "content": "محتوى المقالة",
  "category": "awareness",
  "tags": "توعية,صحة",
  "isPublished": true
}
```

---

## 📦 المكونات الأمامية الجديدة

### `ReportReviewSystem.jsx`
**الميزات:**
- عرض البلاغات مع حالات المراجعة
- تصفية حسب الحالة النهائية
- عرض التفاصيل الكاملة
- لوحات منفصلة للمراجع والمدير والمتحدث
- سجل تاريخي للمراجعات

**الحالات المدعومة:**
```javascript
{
  "report_id": 1,
  "reviewer_status": "pending|approved|rejected",
  "admin_status": "pending|approved|rejected",
  "spokesperson_status": "pending|approved|rejected",
  "final_verdict": "true|false|unverified"
}
```

---

### `ExternalLinksPage.jsx`
**الميزات:**
- عرض الروابط الموثوقة
- تصفية حسب الفئة
- نسخ الروابط
- معلومات عن كل رابط
- أيقونات توضيحية

---

## 🔐 أنظمة الأمان والمصادقة

### التحقق من الأدوار (Role-Based Access Control)

```javascript
// في auth.jsx
user?.role === 'admin'        // مدير
user?.role === 'reviewer'     // مراجع
user?.role === 'spokesperson' // متحدث إعلامي
user?.role === 'user'         // مستخدم عادي
```

### في الجزء الأمامي:
```javascript
{(isReviewer || isAdmin || user?.role === 'spokesperson') && 
  <NavLink to="/review">🛡️ فريق التحقق</NavLink>
}
```

---

## 🔄 سير العمل الثلاثي للمراجعة

```
المستخدم ينشئ بلاغ
         ↓
         ↓ (API: POST /api/reports)
         ↓
    ✅ يُنشأ سجل بلاغ
    ✅ يُنشأ سجل مراجعة (review_id)
         ↓
    المراجع يأتي
         ↓ (API: PUT /api/reports/:id/reviewer-assessment)
    ✅ يُحدّث reviewer_status و reviewer_comment
    ✅ يبقى admin_status = pending
         ↓
    المدير يأتي
         ↓ (API: PUT /api/reports/:id/admin-assessment)
    ✅ يُحدّث admin_status و admin_comment
    ✅ يبقى spokesperson_status = pending
         ↓
    المتحدث الإعلامي يأتي
         ↓ (API: PUT /api/reports/:id/spokesperson-assessment)
    ✅ يُحدّث spokesperson_status و spokesperson_comment
    ✅ يُحدّث final_verdict (true/false/unverified)
         ↓
    ✅ انتهى - البلاغ محقق
```

---

## 📊 مثال على عملية كاملة

### 1. المستخدم يرسل بلاغ
```bash
POST /api/reports
Content-Type: multipart/form-data

{
  "title": "خبر عن وزارة الصحة",
  "description": "أخبار عن فيروس جديد",
  "category": "صحة",
  "tags": "صحة,وزارة الصحة",
  "userId": 5
}
```

### 2. النظام ينشئ المراجعة
```javascript
// في قاعدة البيانات
INSERT INTO report_reviews (report_id) VALUES (1);
// النتيجة: review_id = 1
```

### 3. المراجع يقيم البلاغ
```bash
PUT /api/reports/1/reviewer-assessment
{
  "reviewerId": 2,
  "comment": "هذا بلاغ موثوق يحتاج متابعة",
  "status": "approved"
}
```

### 4. المدير يراجع
```bash
PUT /api/reports/1/admin-assessment
{
  "adminId": 3,
  "comment": "موافق، سيُرسل للمتحدث",
  "status": "approved"
}
```

### 5. المتحدث يصدر البيان
```bash
PUT /api/reports/1/spokesperson-assessment
{
  "spokespersonId": 4,
  "comment": "بناءً على المعلومات الرسمية من وزارة الصحة، هذا الخبر صحيح",
  "status": "approved",
  "finalVerdict": "true"
}
```

### 6. النتيجة
```sql
SELECT * FROM report_reviews WHERE report_id = 1;
-- reviewer_status: approved
-- admin_status: approved
-- spokesperson_status: approved
-- final_verdict: true
```

---

## 🚀 الأداء والتحسينات

### الفهارس المُضافة
```sql
CREATE INDEX idx_review_report ON report_reviews(report_id);
CREATE INDEX idx_review_status ON report_reviews(final_verdict);
CREATE INDEX idx_links_active ON external_links_config(is_active);
```

### المزامنة التلقائية
```javascript
// في AdminDashboard.jsx
useEffect(() => {
  const interval = setInterval(() => {
    api.get(endpoints.dashboard)
      .then(res => setStats(res.data));
  }, 5000); // تحديث كل 5 ثوان
  return () => clearInterval(interval);
}, []);
```

---

## 🛠️ دليل التطوير

### إضافة رابط خارجي جديد

**في قاعدة البيانات:**
```sql
INSERT INTO external_links_config 
(name, url, description, category, link_type, icon)
VALUES 
('اسم الموقع', 'https://...', 'الوصف', 'الفئة', 'النوع', '🔗');
```

**في الكود الأمامي:**
```javascript
// يتم التحديث تلقائياً عند استدعاء GET /api/external-links
```

---

### إضافة دور جديد

**في قاعدة البيانات:**
```sql
ALTER TABLE users MODIFY COLUMN role 
ENUM('user', 'reviewer', 'admin', 'spokesperson', 'new_role') DEFAULT 'user';
```

**في الكود الأمامي:**
```javascript
// في auth.jsx
isNewRole: user?.role === 'new_role',

// في الكود
{user?.role === 'new_role' && <NewRoleComponent />}
```

---

## 📋 Checklist للتطوير

- [ ] اختبر نظام البلاغات الثلاثي المستويات
- [ ] تحقق من عمل جميع API endpoints
- [ ] اختبر الروابط الخارجية المصرية
- [ ] تحقق من المزامنة التلقائية
- [ ] اختبر كل دور على حدة
- [ ] تحقق من الأداء عند 1000+ بلاغ
- [ ] اختبر الحذف والتحديثات
- [ ] تحقق من رسائل الخطأ

---

## 📞 الدعم والتطوير المستقبلي

### الميزات المخططة:
- [ ] نظام التنبيهات الفوري (WebSockets)
- [ ] تقارير متقدمة بصيغة PDF
- [ ] نظام الوسوم الذكي (AI-powered)
- [ ] التكامل مع وسائل الإعلام الاجتماعية
- [ ] نظام الاستئناف للبلاغات المرفوضة

---

**آخر تحديث:** أبريل 2026 | **الإصدار:** 2.0
