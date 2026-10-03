# Solafios Tracker — سولافيوس تراكر

تطبيق إدارة الدروس الخصوصية لمدرسي العلوم والكيمياء.

## ✨ الميزات

- **Dashboard** — إحصائيات شاملة (الطلاب، الجلسات، الدخل، المستحقات)
- **الجدول الأسبوعي** — عرض أسبوعي لكل الطلاب بمواعيدهم
- **التقويم** — شهري ويومي مع إمكانية التبديل
- **الطلاب** — إدارة كاملة (إضافة/تعديل/حظر/أرشفة)
- **صفحة تفاصيل الطالب** — 5 تبويبات:
  - نظرة عامة (السعر، المدفوع، المستحق، الجلسات)
  - الجلسات (مع تعديل الحالة)
  - المدفوعات (سجل كامل)
  - المنهج (تتبع الفصول + شريط تقدم)
  - التقييم (ملاحظات أداء)
- **تقرير قابل للطباعة** — لأي طالب، يحتوي على:
  - الحصص المدفوعة (مع الدفعة المرتبطة)
  - الحصص المستحقة الدفع
  - المبلغ المستحق (عدد الحصص × سعر الحصة)
  - QR code للدفع (IBAN)
  - زر طباعة / حفظ PDF
- **الجلسات** — توليد تلقائي لحد نهاية السنة الدراسية (مع استثناء الإجازات)
- **المدفوعات** — ربط تلقائي بالجلسات التامة غير المفوترة
- **العائلات** — مع خصم إخوة
- **الأماكن** — مع geolocation + رابط خرائط Google
- **الإجازات** — تقويم دراسي كامل
- **السنوات الدراسية** — إدارة سنوات الدراسة
- **الإعدادات** — بيانات الدفع (IBAN)، نسخ احتياطي، مظهر

## 🎨 التصميم

- **Glassmorphism** (Apple style) — خلفية متدرجة + cards شفافة + blur
- **خطوط**: Cairo (عربي) + Inter (إنجليزي)
- **RTL** كامل
- **Light/Dark mode**
- **PWA** — قابل للتثبيت على الموبايل
- **Responsive** — يعمل على الموبايل والديسكتوب

## 🛠️ التقنيات

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Database**: Prisma ORM + PostgreSQL (Supabase) أو SQLite
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Charts**: Recharts
- **QR Code**: qrcode library
- **Icons**: Lucide React

## 🚀 التشغيل محلياً

```bash
# 1. تثبيت الـ dependencies
bun install

# 2. إعداد قاعدة البيانات
cp .env.example .env
# عدّل DATABASE_URL في .env

# 3. تطبيق الـ schema
bun run db:push

# 4. تشغيل السيرفر
bun run dev
```

افتح `http://localhost:3000`

## 🌐 الـ Deploy على Vercel

1. ارفع المشروع على GitHub
2. اذهب إلى [vercel.com](https://vercel.com) وسجل دخول بـ GitHub
3. "Add New Project" → اختار الـ repo
4. في Environment Variables، أضف:
   ```
   DATABASE_URL=postgresql://postgres.wrnosdqilivrzkrvonkp:MennaEslam908%40@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
   ```
5. في `prisma/schema.prisma`، غيّر:
   ```prisma
   datasource db {
     provider = "postgresql"  // بدل "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
6. اضغط "Deploy"

## 📊 قاعدة البيانات

يدعم التطبيق نوعين من قواعد البيانات:

### SQLite (محلي — للتطوير)
```env
DATABASE_URL=file:./db/custom.db
```
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### PostgreSQL (سحابي — للإنتاج)
```env
DATABASE_URL=postgresql://user:password@host:port/database
```
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 💾 النسخ الاحتياطي

- **تصدير**: من الإعدادات → "تصدير نسخة احتياطية" (ينزل ملف JSON)
- **استيراد**: من الإعدادات → "استيراد نسخة" (يرفع ملف JSON)

## 📝 الترخيص

هذا المشروع خاص بـ Solafios Tracker.
