import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// GET /api/backup/export
// Downloads a JSON backup of all data for the current user

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'no user' }, { status: 500 })
  }
  
  const [students, sessions, payments, families, holidays, locations, academicYears] = await Promise.all([
    db.student.findMany({
      where: { userId },
      include: {
        family: true,
        year: true,
        locationRec: true,
      }
    }),
    db.session.findMany({
      where: { userId },
      include: {
        student: {
          select: {
            id: true, userId: true, familyId: true, yearId: true, locationId: true,
            name: true, subject: true, grade: true, stream: true,
            pricePerSession: true, billingType: true, billingN: true,
            weeklyDays: true, sessionTime: true, weeklySchedule: true,
            location: true, phone: true, notes: true, syllabusTarget: true,
            status: true, archived: true, createdAt: true, updatedAt: true,
          }
        }
      }
    }),
    db.payment.findMany({
      where: { userId },
      include: {
        student: {
          select: {
            id: true, userId: true, familyId: true, yearId: true, locationId: true,
            name: true, subject: true, grade: true, stream: true,
            pricePerSession: true, billingType: true, billingN: true,
            weeklyDays: true, sessionTime: true, weeklySchedule: true,
            location: true, phone: true, notes: true, syllabusTarget: true,
            status: true, archived: true, createdAt: true, updatedAt: true,
          }
        }
      }
    }),
    db.family.findMany({
      where: { userId },
      include: { students: { select: { id: true, name: true } } }
    }),
    db.holiday.findMany({ where: { userId } }),
    db.location.findMany({ where: { userId } }),
    db.academicYear.findMany({
      where: { userId },
      include: { _count: { select: { students: true } } }
    }),
  ])
  
  const backup = {
    exportedAt: new Date().toISOString(),
    students,
    sessions,
    payments,
    families,
    holidays,
    locations,
    academicYears,
  }
  
  const filename = `solafios-backup-${new Date().toISOString().slice(0, 10)}.json`
  
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    }
  })
}
