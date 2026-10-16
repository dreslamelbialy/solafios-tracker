# 🚀 دليل التشغيل السريع — Solafios Tracker لصاحبك

**الوقت المطلوب**: 15-20 دقيقة
**المتطلبات**: حساب GitHub + حساب Supabase + حساب Vercel (كلهم مجاناً)

---

## 📋 الخطوات (5 خطوات بس)

### الخطوة 1: انسخ المشروع على GitHub (2 دقيقة)

1. اذهب إلى: **https://github.com/dreslamelbialy/solafios-tracker**
2. اضغط زر **Fork** (في أعلى يمين الصفحة)
3. اختار حسابك → هيتعمل نسخة في حسابك باسم `solafios-tracker`

✅ **النتيجة**: عندك نسخة من الكود على GitHub بحسابك

---

### الخطوة 2: اعمل Supabase Project (5 دقائق)

1. اذهب إلى: **https://supabase.com** واعمل حساب مجاني
2. اضغط **New Project**
3. اسم المشروع: `solafios-tracker` (أي اسم)
4. كلمة مرور قوية للـ database → **احفظها كويس**
5. Region: اختار أقرب منطقة لك (مثلاً `Southeast Asia (Singapore)`)
6. اضغط **Create new project** واستنى 2 دقيقة

✅ **النتيجة**: عندك قاعدة بيانات PostgreSQL سحابية فاضية

---

### الخطوة 3: احصل على DATABASE_URL (1 دقيقة)

1. في Supabase dashboard: **Project Settings** → **Database**
2. انزل لـ **Connection string**
3. اختار **URI**
4. انسخ الـ URL (هيكون شكله زي كده):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. استبدل `[YOUR-PASSWORD]` بكلمة المرور اللي عملتها في الخطوة 2
6. **غيّر** `db.xxxxx.supabase.co` إلى:
   ```
   aws-0-ap-southeast-2.pooler.supabase.com
   ```
   (ده لو منطقتك Singapore — لو منطقة تانية اسأل المساعد)

✅ **النتيجة**: عندك DATABASE_URL جاهز

---

### الخطوة 4: اعمل Deploy على Vercel (5 دقائق)

1. اذهب إلى: **https://vercel.com** وسجل دخول بـ **Continue with GitHub**
2. اضغط **Add New** → **Project**
3. اختار `solafios-tracker` من قائمة repos
4. انزل لـ **Environment Variables** واضغط **Add**
5. اكتب:
   - **Key**: `DATABASE_URL`
   - **Value**: الصق الـ URL من الخطوة 3
6. تأكد إن **Production** + **Preview** + **Development** كلهم متعلّشين ✅
7. اضغط **Deploy** واستني 2-3 دقائق

✅ **النتيجة**: عندك لينك للتطبيق زي `https://solafios-tracker-xxxx.vercel.app`

---

### الخطوة 5: شغّل التطبيق (1 دقيقة)

1. افتح اللينك اللي Vercel إداه
2. التطبيق هيفتح فاضي (مفيش طلاب ولا مدفوعات)
3. روح **الإعدادات** → **بيانات الدفع** وضيف IBAN بتاعك
4. روح **الإعدادات** → **توليد الجلسات** (لو عندك طلاب)
5. ابدأ تضيف طلابك من صفحة **الطلاب**

🎉 **مبروك! التطبيق شغّال عندك**

---

## 🆘 لو حصلت أي مشكلة

اسأل المساعد (Z.ai) في الشات بالظبط زي ما عملت إنت.
ابعتله:
- اللينك بتاع GitHub repo بتاعك
- اللينك بتاع Supabase project
- أي خطأ ظهرلك

المساعد هيحلها معاك بسرعة.

---

## 📞 معلومات مهمة

- **GitHub repo الأصلي**: https://github.com/dreslamelbialy/solafios-tracker
- **التطبيق مثال**: https://solafios-tracker.vercel.app/
- **المساعد**: https://chat.z.ai

---

## ⚠️ ملاحظات مهمة

1. **اللينك بتاعك مش هيتقاسم مع حد تاني** — ده تطبيقك الشخصي
2. **الداتا بتاعتك معزولة تماماً** عن أي حد تاني
3. **كل التعديلات بتعملها على GitHub repo بتاعك** (مش بتاع صاحبك)
4. **للتحديثات**: اقرأ ملف `UPDATES_GUIDE.md` في الـ repo

---

**مبروك التطبيق! 🎉**
