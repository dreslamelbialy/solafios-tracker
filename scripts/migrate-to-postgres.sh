#!/bin/bash
# Solafios Tracker — Migration from SQLite to PostgreSQL
# Usage:
#   1. إنشاء Supabase project مجاني على https://supabase.com
#   2. من Project Settings > Database > Connection string (URI)
#   3. انسخ الـ URL (يبدأ بـ postgresql://postgres.[ref]:[password]@...)
#   4. شغل: POSTGRES_URL="postgresql://..." bash scripts/migrate-to-postgres.sh

set -e

POSTGRES_URL="${1:-$POSTGRES_URL}"

if [ -z "$POSTGRES_URL" ]; then
  echo "❌ خطأ: لازم تمرر POSTGRES_URL"
  echo ""
  echo "الاستخدام:"
  echo "  POSTGRES_URL=\"postgresql://...\" bash scripts/migrate-to-postgres.sh"
  echo ""
  echo "أو:"
  echo "  bash scripts/migrate-to-postgres.sh \"postgresql://...\""
  echo ""
  echo "للحصول على URL من Supabase:"
  echo "  1. اذهب إلى https://supabase.com وأنشئ مشروع جديد (مجاني)"
  echo "  2. Project Settings → Database → Connection string (URI)"
  echo "  3. انسخ الـ URL واستبدل [YOUR-PASSWORD] بكلمة المرور"
  exit 1
fi

echo "🔄 تحديث Prisma schema إلى PostgreSQL..."

# تبديل provider من sqlite إلى postgresql
cd /home/z/my-project
sed -i 's|provider = "sqlite"|provider = "postgresql"|g' prisma/schema.prisma

echo "✅ تم تحديث الـ schema"

echo "🔄 تحديث DATABASE_URL في .env..."
# حفظ القيمة القديمة كـ backup
cp .env .env.sqlite-backup
# استبدال DATABASE_URL
echo "DATABASE_URL=\"$POSTGRES_URL\"" > .env
echo "✅ تم تحديث .env (النسخة القديمة في .env.sqlite-backup)"

echo "🔄 توليد Prisma client الجديد..."
bun run db:generate

echo "🔄 تطبيق الـ schema على PostgreSQL..."
bun run db:push

echo "🔄 استيراد الداتا من SQLite إلى PostgreSQL..."
# الـ script بيقرأ من SQLite القديم ويستورد في PostgreSQL الجديد
bun run scripts/import-backup.ts /home/z/my-project/upload/solafios-backup-2026-10-02.json

echo ""
echo "🎉 تم الترحيل بنجاح!"
echo ""
echo "الخطوات التالية:"
echo "  1. اعمل deploy على Vercel أو أي platform"
echo "  2. ضع POSTGRES_URL في environment variables"
echo "  3. كل الأجهزة هتشوف نفس الداتا من السيرفر السحابي"
