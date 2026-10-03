// Solafios Tracker — Import backup JSON into the database
// Usage: bun run scripts/import-backup.ts <path-to-backup.json> [userId]
// If userId not provided, a default demo user is created/used.

import { db } from '../src/lib/db'
import * as fs from 'fs'
import * as path from 'path'

interface BackupData {
  exportedAt: string
  students: any[]
  sessions: any[]
  payments: any[]
  families: any[]
  holidays: any[]
  locations: any[]
  academicYears: any[]
}

async function main() {
  const backupPath = process.argv[2] || '/home/z/my-project/upload/solafios-backup-2026-10-02.json'
  const rawUserEmail = process.argv[3] || 'solafios@local'

  const raw = fs.readFileSync(backupPath, 'utf-8')
  const data: BackupData = JSON.parse(raw)
  console.log(`[import] Loaded backup from ${backupPath}`)
  console.log(`[import] exportedAt: ${data.exportedAt}`)
  console.log(`[import] counts: students=${data.students.length} sessions=${data.sessions.length} payments=${data.payments.length} families=${data.families.length} holidays=${data.holidays.length} locations=${data.locations.length} years=${data.academicYears.length}`)

  // Find or create user — use the userId from the backup so all FK relations match
  const backupUserId = data.students[0]?.userId || data.families[0]?.userId || data.locations[0]?.userId
  console.log(`[import] backup userId = ${backupUserId}`)

  // Get all existing users to see if our target exists
  const existingUsers = await db.user.findMany()
  let user = existingUsers.find(u => u.id === backupUserId)

  if (!user) {
    // Create with backup's exact id so relations work
    user = await db.user.create({
      data: {
        id: backupUserId,
        email: rawUserEmail,
        name: 'Solafios Teacher',
      }
    })
    console.log(`[import] Created user ${user.id} (${user.email})`)
  } else {
    console.log(`[import] Using existing user ${user.id}`)
  }

  // Track id-mapping in case any auto-id collision happens (we'll keep original ids though)
  const userId = user.id

  // 1. Locations
  console.log('[import] Locations...')
  for (const loc of data.locations) {
    await db.location.upsert({
      where: { id: loc.id },
      create: {
        id: loc.id,
        userId,
        name: loc.name,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
        createdAt: new Date(loc.createdAt),
      },
      update: {
        name: loc.name,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
      }
    })
  }
  console.log(`[import]   ${data.locations.length} locations upserted`)

  // 2. Families
  console.log('[import] Families...')
  for (const fam of data.families) {
    await db.family.upsert({
      where: { id: fam.id },
      create: {
        id: fam.id,
        userId,
        primaryName: fam.primaryName,
        primaryPhone: fam.primaryPhone,
        siblingDiscount: fam.siblingDiscount ?? 0,
        notes: fam.notes,
        createdAt: new Date(fam.createdAt),
      },
      update: {
        primaryName: fam.primaryName,
        primaryPhone: fam.primaryPhone,
        siblingDiscount: fam.siblingDiscount ?? 0,
        notes: fam.notes,
      }
    })
  }
  console.log(`[import]   ${data.families.length} families upserted`)

  // 3. Academic Years
  console.log('[import] Academic Years...')
  for (const yr of data.academicYears) {
    await db.academicYear.upsert({
      where: { id: yr.id },
      create: {
        id: yr.id,
        userId,
        label: yr.label,
        startDate: yr.startDate,
        endDate: yr.endDate,
        archived: yr.archived ?? false,
        createdAt: new Date(yr.createdAt),
      },
      update: {
        label: yr.label,
        startDate: yr.startDate,
        endDate: yr.endDate,
        archived: yr.archived ?? false,
      }
    })
  }
  console.log(`[import]   ${data.academicYears.length} years upserted`)

  // 4. Students
  console.log('[import] Students...')
  let studentsOk = 0
  for (const s of data.students) {
    try {
      await db.student.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          userId,
          familyId: s.familyId,
          yearId: s.yearId,
          locationId: s.locationId,
          name: s.name || '',
          subject: s.subject || '',
          grade: s.grade || '',
          stream: s.stream || 'international',
          pricePerSession: s.pricePerSession ?? 0,
          billingType: s.billingType || 'per_n',
          billingN: s.billingN ?? 4,
          weeklyDays: s.weeklyDays || '[]',
          sessionTime: s.sessionTime || '16:00',
          weeklySchedule: s.weeklySchedule || '[]',
          location: s.location,
          phone: s.phone || '',
          notes: s.notes || '',
          syllabusTarget: s.syllabusTarget || '[]',
          status: s.status || 'active',
          archived: s.archived ?? false,
          createdAt: new Date(s.createdAt),
        },
        update: {
          familyId: s.familyId,
          yearId: s.yearId,
          locationId: s.locationId,
          name: s.name,
          subject: s.subject,
          grade: s.grade,
          stream: s.stream,
          pricePerSession: s.pricePerSession,
          billingType: s.billingType,
          billingN: s.billingN,
          weeklyDays: s.weeklyDays,
          sessionTime: s.sessionTime,
          weeklySchedule: s.weeklySchedule,
          phone: s.phone,
          notes: s.notes,
          status: s.status,
          archived: s.archived,
        }
      })
      studentsOk++
    } catch (e) {
      console.error(`[import]   FAIL student ${s.id} (${s.name}):`, e instanceof Error ? e.message : e)
    }
  }
  console.log(`[import]   ${studentsOk}/${data.students.length} students upserted`)

  // 5. Payments (before sessions, since sessions reference paymentId)
  console.log('[import] Payments...')
  let paymentsOk = 0
  for (const p of data.payments) {
    try {
      await db.payment.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          userId,
          studentId: p.studentId,
          amount: p.amount ?? 0,
          type: p.type || 'full',
          date: p.date,
          notes: p.notes,
          sessionIds: p.sessionIds || '[]',
          sessionCount: p.sessionCount ?? 0,
          isHistorical: p.isHistorical ?? false,
          createdAt: new Date(p.createdAt),
        },
        update: {
          amount: p.amount,
          type: p.type,
          date: p.date,
          notes: p.notes,
          sessionIds: p.sessionIds,
          sessionCount: p.sessionCount,
        }
      })
      paymentsOk++
    } catch (e) {
      console.error(`[import]   FAIL payment ${p.id}:`, e instanceof Error ? e.message : e)
    }
  }
  console.log(`[import]   ${paymentsOk}/${data.payments.length} payments upserted`)

  // 6. Sessions
  console.log('[import] Sessions...')
  let sessionsOk = 0
  for (const s of data.sessions) {
    try {
      await db.session.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          userId,
          studentId: s.studentId,
          date: s.date,
          time: s.time,
          status: s.status || 'scheduled',
          cancelReason: s.cancelReason,
          cancelledBy: s.cancelledBy,
          owedMakeup: s.owedMakeup ?? false,
          chargedToParent: s.chargedToParent ?? false,
          topic: s.topic ?? '',
          homework: s.homework ?? '',
          billed: s.billed ?? false,
          paymentId: s.paymentId,
          isExtra: s.isExtra ?? false,
          isHistorical: s.isHistorical ?? false,
          createdAt: new Date(s.createdAt),
        },
        update: {
          date: s.date,
          time: s.time,
          status: s.status,
          cancelReason: s.cancelReason,
          cancelledBy: s.cancelledBy,
          owedMakeup: s.owedMakeup,
          chargedToParent: s.chargedToParent,
          topic: s.topic ?? '',
          homework: s.homework ?? '',
          billed: s.billed,
          paymentId: s.paymentId,
          isExtra: s.isExtra,
          isHistorical: s.isHistorical,
        }
      })
      sessionsOk++
    } catch (e) {
      console.error(`[import]   FAIL session ${s.id} (studentId=${s.studentId}, date=${s.date}):`, e instanceof Error ? e.message : e)
    }
  }
  console.log(`[import]   ${sessionsOk}/${data.sessions.length} sessions upserted`)

  // 7. Holidays
  console.log('[import] Holidays...')
  let holidaysOk = 0
  for (const h of data.holidays) {
    try {
      await db.holiday.upsert({
        where: { id: h.id },
        create: {
          id: h.id,
          userId,
          title: h.title,
          kind: h.kind || 'holiday',
          stream: h.stream || 'ministry',
          startDate: h.startDate,
          endDate: h.endDate,
          createdAt: new Date(h.createdAt),
        },
        update: {
          title: h.title,
          kind: h.kind,
          stream: h.stream,
          startDate: h.startDate,
          endDate: h.endDate,
        }
      })
      holidaysOk++
    } catch (e) {
      console.error(`[import]   FAIL holiday ${h.id}:`, e instanceof Error ? e.message : e)
    }
  }
  console.log(`[import]   ${holidaysOk}/${data.holidays.length} holidays upserted`)

  console.log('[import] ✅ Done')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
