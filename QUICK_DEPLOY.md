# 🚀 نشر سريع على Vercel - خطوات مباشرة

## 📋 المتطلبات
- حساب Vercel (مجاني)
- حساب GitHub (مجاني)
- المشروع جاهز للنشر

## 🎯 الخطوات السريعة

### 1. إنشاء مستودع GitHub يدوياً
1. اذهب إلى [github.com](https://github.com)
2. انقر على "+" → "New repository"
3. املأ:
   - **Repository name**: `rumor-detection-platform`
   - **Description**: `منصة مواجهة الشائعات وحروب الجيل الباردة`
   - **Visibility**: Public
4. انقر على "Create repository"

### 2. رفع الملفات يدوياً
1. انقر على "uploading an existing file"
2. اسحب وأفلت مجلد المشروع بالكامل
3. أو انقر على "add file" وارفع الملفات الرئيسية:
   - `frontend/` (المجلد بأكمله)
   - `fake-news-backend/` (الخادم الخلفي)
   - `vercel.json` (إعدادات النشر)
   - `README.md` (الوصف)

### 3. النشر على Vercel
1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل الدخول بحساب GitHub
3. انقر على "New Project"
4. اختر مستودع `rumor-detection-platform`
5. اضبط الإعدادات:
   ```
   Framework Preset: Other
   Root Directory: ./
   Build Command: cd frontend && npm run build
   Output Directory: frontend/dist
   Install Command: cd frontend && npm install
   ```
6. انقر على "Deploy"

## 🌐 الروابط بعد النشر

ستحصل على رابط مثل:
`https://rumor-detection-platform.vercel.app`

## 📱 روابط الصفحات
- **الرئيسية**: `https://your-app.vercel.app`
- **تسجيل الدخول**: `https://your-app.vercel.app/login`
- **الدردشة المباشرة**: `https://your-app.vercel.app/realtime-chat`
- **الكشف بالذكاء الاصطناعي**: `https://your-app.vercel.app/ai-detection`
- **لوحة المدير**: `https://your-app.vercel.app/admin`

## ⚙️ متغيرات البيئة المطلوبة

في Vercel Dashboard، أضف:
```
NODE_ENV=production
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=fake_news_db
JWT_SECRET=your_jwt_secret_key_here
```

## 🔄 المزامنة التلقائية

لتفعيل المزامنة التلقائية:
1. في GitHub، اذهب إلى Settings → Branches
2. اجعل `main` هو الـ default branch
3. أي push إلى main سينشر تلقائياً

## 📱 اختبار التطبيق

بعد النشر، اختبر:
1. تسجيل حساب جديد
2. الدردشة المباشرة
3. الكشف بالذكاء الاصطناعي
4. رفع البلاغات

## 🎯 المميزات المتاحة

- ✅ تصميم أسود وذهبي
- ✅ نظام مستخدمين متقدم
- ✅ دردشة فورية
- ✅ كشف بالذكاء الاصطناعي
- ✅ لوحة تحكم للمديرين
- ✅ رفع ملفات متقدم
- ✅ تحليلات وإحصائيات
- ✅ متجاوب للجوال

**المنصة جاهزة بالكامل للنشر!** 🛡️✨
