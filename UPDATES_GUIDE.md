# 📚 دليل التحديثات — Solafios Tracker

كل الطرق اللي تقدر بيها تعمل تحديثات للتطبيق **بدون ما تحتاج الـ chat**.

---

## 🎯 الطريقة 1: التعديل المباشر على GitHub (الأسهل)

**مناسبة لـ**: تعديلات صغيرة في ملف واحد (تغيير لون، نص، إلخ)

### الخطوات:
1. روح على: **https://github.com/dreslamelbialy/solafios-tracker**
2. تصفح الملفات وافتح اللي عاوز تعدله
3. اضغط زر ✏️ **Edit** (في يمين الصفحة فوق الكود)
4. عدّل الكود
5. اكتب رسالة التعديل في **Commit changes**
6. اضغط **Commit changes** (أخضر)
7. **Vercel هيعمل deploy تلقائياً** خلال 1-2 دقيقة ✨

### مثال:
لو عاوز تغير لون الـ primary من coral لـ blue:
1. افتح `src/app/globals.css`
2. دور على `--primary: oklch(0.68 0.16 40);`
3. غيّره لـ `--primary: oklch(0.55 0.18 250);` (أزرق)
4. Commit + Save

---

## 🎯 الطريقة 2: GitHub Codespaces (محرر كامل في المتصفح)

**مناسبة لـ**: تعديلات في أكتر من ملف، أو تعديلات كبيرة

### الخطوات:
1. روح على: **https://github.com/dreslamelbialy/solafios-tracker**
2. اضغط زر **Code** (أخضر) → تبويب **Codespaces**
3. اضغط **Create codespace on main**
4. هتفتح لك **VS Code في المتصفح** فيه كل المشروع
5. عدّل اللي عاوزه (يقدر يفتح أكتر من ملف)
6. من الـ Source Control (في الشمال): اكتب رسالة + Commit + Push
7. Vercel هيعمل deploy تلقائياً

### الميزة:
- محرر كامل (VS Code) من غير ما تنزل حاجة
- تقدر تفتحه من أي جهاز (موبايل/لابتوب)
- الـ Changes بتتحفظ على GitHub

---

## 🎯 الطريقة 3: VS Code على جهازك + Git (الأقوى)

**مناسبة لـ**: الأعمال الكبيرة، تعديلات كتير، إضافة features

### التثبيت (مرة واحدة):
1. نزل **VS Code** من https://code.visualstudio.com
2. نزل **Git** من https://git-scm.com
3. اتأكد إن Git اتثبت: افتح Terminal واكتب `git --version`

### التنفيذ (كل مرة):
```bash
# 1. تنزيل المشروع (مرة واحدة)
git clone https://github.com/dreslamelbialy/solafios-tracker.git
cd solafios-tracker

# 2. تثبيت الـ dependencies (مرة واحدة)
bun install

# 3. تشغيل السيرفر محلياً للتجربة
bun run dev
# افتح http://localhost:3000

# 4. بعد التعديل، ارفع التغييرات
git add .
git commit -m "وصف التعديل بالعربي"
git push
```

### الميزة:
- تقدر تختبر التعديلات محلياً قبل ما ترفعها
- تقدر تشتغل offline
- تقدر ترجع لأي نسخة قديمة (git log + git checkout)

---

## 🎯 الطريقة 4: تعديل في ورقة ملاحظات + طلب من الشات

**مناسبة لـ**: التعديلات المعقدة اللي محتاجة مساعدة

### الخطوات:
1. افتح ملف **`تحديثات_مطلوبة.md`** (في root المشروع)
2. اكتب فيه اللي عاوزه بالتفصيل
3. اعمل Commit + Push لـ GitHub
4. افتح الـ chat (Z.ai) واكتب:
   ```
   افتح ملف تحديثات_مطلوبة.md ونفذ اللي فيه
   ```
5. الـ chat هيقرأ الملف وينفذ التعديلات

---

## 🆘 حل المشاكل الشائعة

### المشكلة: عملت تعديل بس التطبيق مش بيتحدث
**الحل**:
1. امسح cache المتصفح: Ctrl+Shift+R (أو Cmd+Shift+R على Mac)
2. راجع Vercel: https://vercel.com/dashboard → solafios-tracker → Deployments
3. لو فيه خطأ في الـ Build Logs، اعرضه على الـ chat

### المشكلة: عملت تعديل غلط والتطبيق وقف
**الحل**: ارجع للنسخة القديمة
1. روح على GitHub → repo → **Commits**
2. دور على آخر commit شغال
3. اضغط عليه → **Browse files**
4. او اضغط **Revert** للـ commit الغلط

### المشكلة: محتاج مساعدة
**الحل**: افتح الـ chat واكتب:
```
عاوز مساعدة في [وصف المشكلة]
التطبيق: https://solafios-tracker.vercel.app/
الـ repo: https://github.com/dreslamelbialy/solafios-tracker
```

---

## 📊 مقارنة سريعة

| الطريقة | السهولة | القوة | يحتاج تنزيل | يحتاج chat |
|---------|---------|-------|-------------|------------|
| GitHub Edit | ⭐⭐⭐⭐⭐ | ⭐⭐ | ❌ | ❌ |
| Codespaces | ⭐⭐⭐⭐ | ⭐⭐⭐ | ❌ | ❌ |
| Local VS Code | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ❌ |
| Notes + Chat | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ | ✅ |

---

## 🔒 ضمانات إضافية

### 1. نسخة احتياطية أسبوعية تلقائية
- سكريبت `scripts/weekly-backup.ts` بيشتغل كل أسبوع
- بيحفظ نسخة من كل الداتا في `download/backups/`
- تقدر تشغله يدوياً: `bun run scripts/weekly-backup.ts`

### 2. ملف تحديثات_مطلوبة.md
- اكتب فيه اللي عاوزه
- كل ما تفتح الشات، اطلب منه يقرأ الملف وينفذه

---

## 📞 معلومات مهمة

- **رابط التطبيق**: https://solafios-tracker.vercel.app/
- **رابط GitHub**: https://github.com/dreslamelbialy/solafios-tracker
- **رابط Vercel**: https://vercel.com/dashboard
- **رابط Supabase**: https://supabase.com/dashboard (project: wrnosdqilivrzkrvonkp)

---

**آخر تحديث**: أكتوبر 2026
