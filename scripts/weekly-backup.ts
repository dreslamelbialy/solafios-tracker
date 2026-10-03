// Weekly backup script
// Creates a JSON backup of all data and saves it to download/backups/
// Can be run manually: bun run scripts/weekly-backup.ts
// Or scheduled via cron/scheduled task

import { db } from '../src/lib/db'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  console.log('🔄 بدء النسخة الاحتياطية الأسبوعية...')
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dateStr = new Date().toISOString().slice(0, 10)
  
  const [students, sessions, payments, families, holidays, locations, academicYears, users] = await Promise.all([
    db.student.findMany({ include: { family: true, year: true, locationRec: true } }),
    db.session.findMany({ include: { student: { select: { id: true, name: true, subject: true, grade: true } } } }),
    db.payment.findMany({ include: { student: { select: { id: true, name: true } } } }),
    db.family.findMany({ include: { students: { select: { id: true, name: true } } } }),
    db.holiday.findMany(),
    db.location.findMany(),
    db.academicYear.findMany(),
    db.user.findMany({ select: { id: true, email: true, name: true, iban: true, bankName: true, beneficiaryName: true } }),
  ])
  
  const backup = {
    exportedAt: new Date().toISOString(),
    version: '2.1.0',
    counts: {
      students: students.length,
      sessions: sessions.length,
      payments: payments.length,
      families: families.length,
      holidays: holidays.length,
      locations: locations.length,
      academicYears: academicYears.length,
      users: users.length,
    },
    users,
    students,
    sessions,
    payments,
    families,
    holidays,
    locations,
    academicYears,
  }
  
  // Create backups directory
  const backupsDir = '/home/z/my-project/download/backups'
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true })
  }
  
  // Save backup
  const filename = `solafios-backup-${dateStr}.json`
  const filepath = path.join(backupsDir, filename)
  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8')
  
  console.log(`✅ تم حفظ النسخة الاحتياطية: ${filepath}`)
  console.log(`📊 الإحصائيات:`)
  console.log(`   - الطلاب: ${backup.counts.students}`)
  console.log(`   - الجلسات: ${backup.counts.sessions}`)
  console.log(`   - المدفوعات: ${backup.counts.payments}`)
  console.log(`   - العائلات: ${backup.counts.families}`)
  console.log(`   - الإجازات: ${backup.counts.holidays}`)
  console.log(`   - الأماكن: ${backup.counts.locations}`)
  console.log(`   - السنوات: ${backup.counts.academicYears}`)
  
  // Keep only last 8 backups (2 months)
  const allBackups = fs.readdirSync(backupsDir)
    .filter(f => f.startsWith('solafios-backup-') && f.endsWith('.json'))
    .sort()
  
  if (allBackups.length > 8) {
    const toDelete = allBackups.slice(0, allBackups.length - 8)
    for (const f of toDelete) {
      fs.unlinkSync(path.join(backupsDir, f))
      console.log(`🗑️  تم حذف نسخة قديمة: ${f}`)
    }
  }
  
  console.log('🎉 تمت النسخة الاحتياطية بنجاح!')
  
  await db.$disconnect()
}

main().catch(e => {
  console.error('❌ خطأ في النسخة الاحتياطية:', e)
  process.exit(1)
})
