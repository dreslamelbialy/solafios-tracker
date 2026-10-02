# Solafios Tracker — Work Log

---
Task ID: 1
Agent: Super Z (main)
Task: إعادة بناء تطبيق "Solafios Tracker" من الصفر بناءً على backup JSON، مع الحفاظ على نفس الـ schema والداتا، وإصلاح الـ bugs، وإضافة تحسينات.

Work Log:
- فحص اللينك اللايف (preview-chat-7d08affb-...): أكد أن الأب Next.js 16 RTL عربي بثيم أخضر #2F6F63 و PWA manifest
- قراءة ملف الـ backup `/home/z/my-project/upload/solafios-backup-2026-10-02.json` (110KB) وتحليل كل entities:
  - 8 طلاب، 42 جلسة، 10 مدفوعات، 2 عائلات، 65 إجازة/حدث، 7 أماكن، 1 سنة دراسية
- استلام موافقة المستخدم: "إعادة بناء كامل + تحسينات + إصلاح bugs + الأولوية للداتا"
- تهيئة البيئة عبر `init-fullstack.sh` وتأكيد عمل dev server على port 3000
- بناء Prisma schema كامل (8 موديلات): User, Family, Location, AcademicYear, Student, Session, Payment, Holiday — مع الفهارس والعلاقات الصحيحة
- تنفيذ `bun run db:push` بنجاح
- كتابة سكريبت استيراد `scripts/import-backup.ts`:
  - المشكلة الأولى: 28 جلسة فشلت بسبب `topic: null` في الـ backup → أُصلحت بـ `?? ''`
  - النتيجة النهائية: 100% من كل entities اتستوردت بنجاح
- تجهيز الـ layout: فونت Cairo، RTL، ثيم أخضر #2F6F63، PWA manifest، logo SVG، ThemeProvider
- بناء API routes كاملة:
  - `/api/students` + `/[id]` (GET/POST/PUT/DELETE)
  - `/api/sessions` + `/[id]` + `/generate` (توليد تلقائي من الجدول الأسبوعي مع تخطي الإجازات)
  - `/api/payments` + `/[id]` (مع ربط/فك ربط الجلسات تلقائياً)
  - `/api/families`, `/api/locations`, `/api/holidays`, `/api/years` + `/[id]`
  - `/api/stats` (dashboard aggregates: counts, revenue, upcoming, byStatus, bySubject, monthlyTrend, topStudents, unbilled)
  - `/api/backup/export` + `/api/backup/import` (upsert كامل)
- بناء 9 واجهات (views) في `src/components/solafios/`:
  - sidebar.tsx (navigation + mobile header)
  - dashboard-view.tsx (KPIs + revenue chart + subject pie + upcoming + unbilled + top students)
  - students-view.tsx (list + filters + create/edit sheet + archive/delete)
  - sessions-view.tsx (day/all view + status quick actions + edit sheet + generate dialog)
  - payments-view.tsx (list + auto-link unbilled sessions + auto-calc amount)
  - families-view.tsx (CRUD + sibling discount)
  - holidays-view.tsx (upcoming/past sections + filters)
  - locations-view.tsx (CRUD + geolocation + Google Maps link)
  - years-view.tsx (CRUD + archive)
  - settings-view.tsx (export/import + theme toggle + about)
- إصلاح bug: lucide-react مش عنده `Event` export → استبدلناه بـ `CalendarClock`
- التحقق عبر Agent Browser:
  - Dashboard: KPIs تظهر القيم الصحيحة (6 طلاب نشطين، 1 جلسة اليوم، 4,300 ر.س دخل السنة)
  - Students: 8 طلاب بيظهروا
  - Sessions: جلسات اليوم (Rokaia completed)
  - Payments: 10 دفعات
  - Holidays: 53 قادمة + 12 سابقة
  - Locations: 7 أماكن مع روابط خرائط
  - Settings: export/import + theme toggle
- مفيش runtime errors في console

Stage Summary:
- تم إعادة بناء التطبيق بالكامل بنفس الـ schema والداتا الأصلية
- كل البيانات الـ 8 طلاب / 42 جلسة / 10 مدفوعات / 2 عائلات / 65 إجازة / 7 أماكن / 1 سنة — موجودة ويمكن تعديلها
- التطبيق يعمل على http://localhost:3000/ بنجاح
- 9 واجهات كاملة، 17 API endpoint، backup/export/import شغّال
- Bugs تم إصلاحها: 
  1) null topic/homework في الـ backup (تم coerce إلى empty string)
  2) lucide-react Event import (تم استبداله بـ CalendarClock)
- التحسينات المضافة:
  1) توليد تلقائي للجلسات من الجدول الأسبوعي مع تخطي الإجازات
  2) ربط تلقائي بين المدفوعات والجلسات التامة غير المفوترة + حساب تلقائي للمبلغ
  3) عرض الجلسات غير المفوترة في الـ dashboard كـ "تنبيه"
  4) ميزة الـ geolocation في الأماكن
  5) ثيم فاتح/داكن/تلقائي
  6) PWA manifest + RTL كامل + فونت Cairo
- اللينك اللايف: https://preview-chat-7d08affb-7199-4038-b762-86adcb5a367f.space-z.ai/
- ملفات الإخراج في `/home/z/my-project/download/`:
  - dashboard-preview.png (لقطات شاشة)
  - dashboard-mobile.png
  - students-desktop.png
  - payments-desktop.png

---
Task ID: 2
Agent: Super Z (main)
Task: تحديثات رئيسية على التطبيق بناءً على ملاحظات المستخدم — إضافة الجدول، توليد الجلسات للسنة الدراسية، صفحة تفاصيل الطالب، تقرير قابل للطباعة، WhatsApp، حظر، منهج، تقييم

Work Log:
- تحليل صورتين من التطبيق القديم عبر VLM:
  - IMG_2044: واجهة "تقرير الدفع" — تقرير كامل لطالب مع QR code و IBAN وسجل دفعات
  - IMG_2046: واجهة "Tahsili Chemistry(Saadon)" — تفاصيل الطالب مع أزرار WhatsApp، تسجيل غياب، إعادة جدولة، تقييم، متابعة المنهج
- تحديث Prisma schema:
  - User: إضافة iban, bankAccount, bankName, beneficiaryName, expectedProfitMargin
  - Student: إضافة blocked, curriculumProgress (JSON), evaluation
  - تطبيق db:push بنجاح
- إعادة بناء /api/sessions/generate:
  - بدل ما يعمل N أسابيع، دلوقتي بيشتغل لحد نهاية السنة الدراسية (endDate من AcademicYear)
  - بيتخطى الإجازات تلقائياً (مع respect لـ stream)
  - بيتخطى الجلسات الموجودة فعلاً (deduplication)
  - نتيجة الاختبار: skippedOnHolidays=142، created=0 (كل الجلسات موجودة)
- إضافة API routes جديدة:
  - /api/user (GET/PUT) — بيانات المدرس (IBAN، بنك)
  - /api/students/[id]/report — تقرير كامل قابل للطباعة
  - /api/students/[id]/block — حظر/فك حظر
  - /api/students/[id]/curriculum — حفظ المنهج والتقييم
- بناء Schedule view (الجدول الأسبوعي):
  - 7 أعمدة (الأحد-السبت)
  - فلتر بالنظام
  - أزرار التنقل بين الأسابيع (السابق/القادم)
  - إحصائيات توزيع الطلاب على الأيام
- بناء Student Detail view (صفحة تفاصيل الطالب):
  - 4 KPI cards: السعر، إجمالي المدفوع، المستحق حالياً، إجمالي الجلسات
  - 5 تبويبات: نظرة عامة، الجلسات، المدفوعات، المنهج، التقييم
  - أزرار: تقرير، واتساب، حظر، تعديل
  - حساب المبلغ المستحق تلقائياً (per_n: fullPackages × price / monthly: count × price)
- بناء Report dialog (تقرير قابل للطباعة):
  - بيانات الطالب الكاملة
  - جدول آخر الجلسات (10 جلسات)
  - جدول سجل الدفعات السابقة
  - المبلغ المستحق حالياً
  - QR code يحوي: IBAN، المستفيد، المبلغ، اسم الطالب (يُولّد عبر qrcode library)
  - زر طباعة/حفظ PDF يفتح نافذة جديدة بـ print-ready HTML
- إضافة WhatsApp integration:
  - زر واتساب في صفحة الطالب + بطاقة الطالب
  - يفتح wa.me مع رسالة جاهزة
- إضافة ميزات إدارة الطالب:
  - حظر/فك حظر (blocked boolean)
  - متابعة المنهج (curriculumProgress كـ JSON array مع chapter/notes/completed/date)
  - تقييم أداء (evaluation نص حر)
  - شريط تقدم المنهج (progress bar)
- تحديث الـ Sidebar:
  - إضافة "الجدول" (CalendarDays) في القائمة الرئيسية
  - ترتيب: الرئيسية → الجدول → الطلاب → الجلسات → المدفوعات
- تحديث الـ Settings view:
  - إضافة بطاقة "توليد الجلسات للسنة الدراسية"
  - إضافة بطاقة "بيانات الدفع" (IBAN، بنك، مستفيد)
  - الإصدار 2.1.0
- تحديث /api/students/[id] GET ليشمل payments.sessions (relations كاملة)
- اختبار عبر Agent Browser:
  - Schedule: بيعرض كل الطلاب في 7 أعمدة مع التواريخ
  - Student Detail: 5 تبويبات شغالة، KPIs صحيحة، WhatsApp button visible
  - Report Dialog: بيفتح، يعرض الجلسات والمدفوعات، زر الطباعة موجود
  - Settings: حقول البنك + توليد الجلسات ظاهرة
  - لا runtime errors

Stage Summary:
- تمت إضافة جميع الميزات المطلوبة من التطبيق القديم
- التطبيق الآن يحتوي على:
  1. صفحة "الجدول" الأسبوعي (مش موجودة في الإصدار السابق)
  2. توليد الجلسات لحد نهاية السنة الدراسية (بدل شهر واحد) مع استثناء الإجازات
  3. صفحة تفاصيل الطالب الكاملة (5 تبويبات)
  4. تقرير قابل للطباعة لأي طالب مع QR code و IBAN
  5. WhatsApp integration
  6. حظر الطالب
  7. متابعة المنهج + التقييم
  8. بيانات الدفع (IBAN، بنك) في الإعدادات
- كل البيانات المالية محفوظة + قابلة للعرض في صفحة الطالب
- اللينك اللايف: https://preview-chat-7d08affb-7199-4038-b762-86adcb5a367f.space-z.ai/
