import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// POST /api/backup/import
// Body: { data: <backup JSON object> }
// Imports (upserts) all entities. Existing IDs are updated, new ones are created.

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'no user' }, { status: 500 })
  }
  
  const body = await req.json()
  const data = body.data || body
  
  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'invalid backup format' }, { status: 400 })
  }
  
  const results = {
    locations: 0,
    families: 0,
    academicYears: 0,
    students: 0,
    payments: 0,
    sessions: 0,
    holidays: 0,
    errors: [] as string[],
  }
  
  // 1. Locations
  if (Array.isArray(data.locations)) {
    for (const loc of data.locations) {
      try {
        await db.location.upsert({
          where: { id: loc.id },
          create: {
            id: loc.id,
            userId,
            name: loc.name || '',
            address: loc.address,
            lat: loc.lat,
            lng: loc.lng,
            createdAt: loc.createdAt ? new Date(loc.createdAt) : undefined,
          },
          update: {
            name: loc.name,
            address: loc.address,
            lat: loc.lat,
            lng: loc.lng,
          }
        })
        results.locations++
      } catch (e) {
        results.errors.push(`location ${loc.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }
  
  // 2. Families
  if (Array.isArray(data.families)) {
    for (const fam of data.families) {
      try {
        await db.family.upsert({
          where: { id: fam.id },
          create: {
            id: fam.id,
            userId,
            primaryName: fam.primaryName || '',
            primaryPhone: fam.primaryPhone,
            siblingDiscount: fam.siblingDiscount ?? 0,
            notes: fam.notes,
            createdAt: fam.createdAt ? new Date(fam.createdAt) : undefined,
          },
          update: {
            primaryName: fam.primaryName,
            primaryPhone: fam.primaryPhone,
            siblingDiscount: fam.siblingDiscount ?? 0,
            notes: fam.notes,
          }
        })
        results.families++
      } catch (e) {
        results.errors.push(`family ${fam.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }
  
  // 3. Academic Years
  if (Array.isArray(data.academicYears)) {
    for (const yr of data.academicYears) {
      try {
        await db.academicYear.upsert({
          where: { id: yr.id },
          create: {
            id: yr.id,
            userId,
            label: yr.label || '',
            startDate: yr.startDate,
            endDate: yr.endDate,
            archived: yr.archived ?? false,
            createdAt: yr.createdAt ? new Date(yr.createdAt) : undefined,
          },
          update: {
            label: yr.label,
            startDate: yr.startDate,
            endDate: yr.endDate,
            archived: yr.archived ?? false,
          }
        })
        results.academicYears++
      } catch (e) {
        results.errors.push(`year ${yr.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }
  
  // 4. Students
  if (Array.isArray(data.students)) {
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
            createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
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
        results.students++
      } catch (e) {
        results.errors.push(`student ${s.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }
  
  // 5. Payments (before sessions, since sessions reference paymentId)
  if (Array.isArray(data.payments)) {
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
            createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
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
        results.payments++
      } catch (e) {
        results.errors.push(`payment ${p.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }
  
  // 6. Sessions
  if (Array.isArray(data.sessions)) {
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
            createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
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
        results.sessions++
      } catch (e) {
        results.errors.push(`session ${s.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }
  
  // 7. Holidays
  if (Array.isArray(data.holidays)) {
    for (const h of data.holidays) {
      try {
        await db.holiday.upsert({
          where: { id: h.id },
          create: {
            id: h.id,
            userId,
            title: h.title || '',
            kind: h.kind || 'holiday',
            stream: h.stream || 'ministry',
            startDate: h.startDate,
            endDate: h.endDate,
            createdAt: h.createdAt ? new Date(h.createdAt) : undefined,
          },
          update: {
            title: h.title,
            kind: h.kind,
            stream: h.stream,
            startDate: h.startDate,
            endDate: h.endDate,
          }
        })
        results.holidays++
      } catch (e) {
        results.errors.push(`holiday ${h.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }
  
  return NextResponse.json(results)
}
