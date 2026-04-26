# 🚀 نشر منصة مواجهة الشائعات على Vercel

## 📋 المتطلبات الأساسية

1. حساب Vercel (يمكن إنشاؤه مجاناً)
2. حساب GitHub (للمزامنة التلقائية)
3. قاعدة بيانات MySQL (للخادم الخلفي)

## 🛠️ خطوات النشر

### 1. إعداد المشروع

```bash
# إنشاء مستودع GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/rumor-detection-platform.git
git push -u origin main
```

### 2. نشر على Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل الدخول بحساب GitHub
3. انقر على "New Project"
4. اختر مستودع GitHub
5. اضبط الإعدادات التالية:

**Framework Preset:** Other
**Root Directory:** ./
**Build Command:** cd frontend && npm run build
**Output Directory:** frontend/dist
**Install Command:** cd frontend && npm install

### 3. إعداد متغيرات البيئة

في Vercel Dashboard، أضف متغيرات البيئة التالية:

```
NODE_ENV=production
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
```

### 4. إعداد قاعدة البيانات

استخدم خدمة قاعدة بيانات خارجية مثل:
- PlanetScale (موصى به لـ Vercel)
- Supabase
- Railway
- Heroku Postgres

## 🔄 المزامنة التلقائية

### إعداد GitHub Actions

أنشئ ملف `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd frontend
        npm install
        
    - name: Build project
      run: |
        cd frontend
        npm run build
        
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 🌐 رابط النشر النهائي

بعد اكتمال النشر، ستحصل على رابط مثل:
`https://rumor-detection-platform.vercel.app`

## 📱 اختبار التطبيق

1. **الصفحة الرئيسية:** `https://your-app.vercel.app`
2. **تسجيل الدخول:** `https://your-app.vercel.app/login`
3. **الدردشة المباشرة:** `https://your-app.vercel.app/realtime-chat`
4. **الكشف بالذكاء الاصطناعي:** `https://your-app.vercel.app/ai-detection`

## 🔧 استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في الاتصال بقاعدة البيانات**
   - تحقق من متغيرات البيئة
   - تأكد من أن قاعدة البيانات متاحة

2. **خطأ في بناء المشروع**
   - تحقق من `package.json`
   - تأكد من جميع الاعتماديات مثبتة

3. **مشاكل في المسارات**
   - تحقق من `vercel.json`
   - تأكد من إعدادات التوجيه صحيحة

## 📈 تحسينات ما بعد النشر

1. **إضافة تحليلات Google Analytics**
2. **إعداد SSL certificate**
3. **تحسين SEO**
4. **إضافة error monitoring**

## 🤝 المساهمات

لإضافة مميزات جديدة:

1. أنشئ branch جديد
2. أضف التغييرات
3. أنشئ Pull Request
4. سيتم النشر تلقائياً بعد الموافقة

## 📞 الدعم

لأي استفسارات، تواصل مع فريق الدعم.
