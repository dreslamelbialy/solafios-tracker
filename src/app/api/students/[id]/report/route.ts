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
  
  // Categorize sessions for the report:
  // - PAID sessions: completed AND billed (have a paymentId)
  // - DUE sessions: completed AND NOT billed (not yet paid)
  // - Other sessions (scheduled, cancelled) are excluded from the financial tables
  
  const paidSessions = sessions.filter(s =>
    s.status === 'completed' && s.billed
  )
  const dueSessions = sessions.filter(s =>
    s.status === 'completed' && !s.billed && !s.isHistorical
  )
  
  // Calculate current outstanding amount
  let outstandingAmount = 0
  let outstandingSessionsCount = dueSessions.length
  let billingProgress = ''
  
  if (student.billingType === 'per_n') {
    const billingN = student.billingN || 1
    const fullPackages = Math.floor(outstandingSessionsCount / billingN)
    outstandingAmount = fullPackages * student.pricePerSession
    billingProgress = `${outstandingSessionsCount}/${billingN} حصة` +
      (fullPackages > 0 ? ` (${fullPackages} باقة مستحقة)` : '')
  } else {
    outstandingAmount = outstandingSessionsCount * student.pricePerSession
    billingProgress = `${outstandingSessionsCount} حصة مستحقة`
  }
  
  // Total paid (sum of all payments)
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  
  // Group paid sessions by payment (each payment → its sessions)
  const sessionsByPayment = new Map<string, typeof sessions>()
  for (const s of paidSessions) {
    if (!s.paymentId) continue
    if (!sessionsByPayment.has(s.paymentId)) sessionsByPayment.set(s.paymentId, [])
    sessionsByPayment.get(s.paymentId)!.push(s)
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
      // General stats (all sessions)
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      cancelledSessions: sessions.filter(s => s.status.startsWith('cancelled')).length,
      scheduledSessions: sessions.filter(s => s.status === 'scheduled').length,
      
      // Financial stats — THE KEY DATA FOR THE REPORT
      totalPaid,                              // إجمالي ما دفعه ولي الأمر
      totalPayments: payments.length,
      paidSessionsCount: paidSessions.length,  // عدد الحصص المدفوعة
      dueSessionsCount: dueSessions.length,    // عدد الحصص المستحقة (تامة وغير مدفوعة)
      outstandingAmount,                       // المبلغ المستحق حالياً
      billingProgress,
      
      // For per_n: how many sessions until next package is due
      sessionsUntilNextPackage: student.billingType === 'per_n'
        ? ((student.billingN || 1) - (dueSessions.length % (student.billingN || 1))) % (student.billingN || 1)
        : 0,
    },
    // For the report: only PAID and DUE sessions (not all sessions)
    paidSessions,   // الحصص المدفوعة
    dueSessions,    // الحصص المستحقة الدفع
    payments,       // سجل كل الدفعات
    sessionsByPayment: Array.from(sessionsByPayment.entries()).map(([pid, items]) => ({
      paymentId: pid,
      sessions: items,
      payment: payments.find(p => p.id === pid),
    })),
  }
  
  return NextResponse.json(report)
}
