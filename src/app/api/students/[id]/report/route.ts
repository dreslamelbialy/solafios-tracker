import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'
import { safeJsonParse } from '@/lib/solafios'

// GET /api/students/[id]/report
// Returns full report data for a student (used for printable invoice/report).
// Includes: student profile, all sessions, all payments, current outstanding amount,
// teacher bank info, and academic year context.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'no user' }, { status: 500 })
  
  const [student, sessions, payments, teacher, year] = await Promise.all([
    db.student.findUnique({
      where: { id },
      include: {
        family: true,
        locationRec: true,
      }
    }),
    db.session.findMany({
      where: { studentId: id },
      orderBy: [{ date: 'asc' }, { time: 'asc' }]
    }),
    db.payment.findMany({
      where: { studentId: id },
      orderBy: { date: 'desc' }
    }),
    db.user.findUnique({ where: { id: userId } }),
    // active year
    db.academicYear.findFirst({
      where: { userId, archived: false },
      orderBy: { endDate: 'desc' }
    })
  ])
  
  if (!student) return NextResponse.json({ error: 'student not found' }, { status: 404 })
  
  // Calculate current outstanding amount:
  // For per_n billing: count completed+unbilled sessions, divide by billingN, multiply by pricePerSession
  // For monthly billing: count completed+unbilled sessions in current month * pricePerSession
  const completedUnbilledSessions = sessions.filter(s =>
    s.status === 'completed' && !s.billed && !s.isHistorical
  )
  
  let outstandingAmount = 0
  let outstandingSessionsCount = completedUnbilledSessions.length
  let billingProgress = '' // human readable
  
  if (student.billingType === 'per_n') {
    const billingN = student.billingN || 1
    const fullPackages = Math.floor(outstandingSessionsCount / billingN)
    const remainder = outstandingSessionsCount % billingN
    outstandingAmount = fullPackages * student.pricePerSession
    billingProgress = `${outstandingSessionsCount}/${billingN} حصة` +
      (fullPackages > 0 ? ` (${fullPackages} باعة مستحقة)` : '')
  } else {
    // monthly: each completed+unbilled session = pricePerSession
    outstandingAmount = outstandingSessionsCount * student.pricePerSession
    billingProgress = `${outstandingSessionsCount} حصة غير مفوترة`
  }
  
  // Total paid (sum of all payments)
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  
  // Group sessions by month for the report
  const sessionsByMonth = new Map<string, typeof sessions>()
  for (const s of sessions) {
    const monthKey = s.date.slice(0, 7) // YYYY-MM
    if (!sessionsByMonth.has(monthKey)) sessionsByMonth.set(monthKey, [])
    sessionsByMonth.get(monthKey)!.push(s)
  }
  
  // Build report object
  const report = {
    generatedAt: new Date().toISOString(),
    student: {
      id: student.id,
      name: student.name,
      subject: student.subject,
      grade: student.grade,
      stream: student.stream,
      phone: student.phone,
      notes: student.notes,
      status: student.status,
      pricePerSession: student.pricePerSession,
      billingType: student.billingType,
      billingN: student.billingN,
      weeklySchedule: safeJsonParse(student.weeklySchedule, []),
      sessionTime: student.sessionTime,
      family: student.family,
      location: student.locationRec,
      createdAt: student.createdAt,
    },
    teacher: {
      name: teacher?.name || '',
      iban: teacher?.iban || '',
      bankAccount: teacher?.bankAccount || '',
      bankName: teacher?.bankName || '',
      beneficiaryName: teacher?.beneficiaryName || '',
    },
    academicYear: year ? {
      label: year.label,
      startDate: year.startDate,
      endDate: year.endDate,
    } : null,
    summary: {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      cancelledSessions: sessions.filter(s => s.status.startsWith('cancelled')).length,
      scheduledSessions: sessions.filter(s => s.status === 'scheduled').length,
      totalPayments: payments.length,
      totalPaid,
      outstandingSessions: outstandingSessionsCount,
      outstandingAmount,
      billingProgress,
    },
    sessions, // all sessions, ordered by date asc
    payments, // all payments, ordered by date desc
    sessionsByMonth: Array.from(sessionsByMonth.entries()).map(([month, items]) => ({
      month,
      sessions: items,
    })),
  }
  
  return NextResponse.json(report)
}
