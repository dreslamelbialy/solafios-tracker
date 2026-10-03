import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'
import { todayStr, safeJsonParse } from '@/lib/solafios'

// GET /api/stats
// Returns dashboard statistics:
//   - counts (students, sessions today/this week/this month, payments this month)
//   - revenue this month + this year
//   - upcoming sessions (next 7 days)
//   - sessions by status
//   - sessions by subject
//   - monthly revenue trend (last 6 months)
//   - top students by revenue
//   - unbilled sessions (per_n students with completed but unbilled sessions)

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({
      error: 'no user',
      counts: {},
      revenue: {},
      upcoming: [],
      byStatus: [],
      bySubject: [],
      monthlyTrend: [],
      topStudents: [],
      unbilled: [],
    })
  }
  
  const { searchParams } = new URL(req.url)
  const today = searchParams.get('date') || todayStr()
  
  // Calculate this week range (Sun-Sat)
  const todayDate = new Date(today + 'T00:00:00')
  const dayOfWeek = todayDate.getDay() // 0 = Sun
  const weekStart = new Date(todayDate)
  weekStart.setDate(todayDate.getDate() - dayOfWeek)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekStartStr = weekStart.toISOString().slice(0, 10)
  const weekEndStr = weekEnd.toISOString().slice(0, 10)
  
  // This month range
  const monthStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
  const monthEnd = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0)
  const monthStartStr = monthStart.toISOString().slice(0, 10)
  const monthEndStr = monthEnd.toISOString().slice(0, 10)
  
  // This year range
  const yearStartStr = `${todayDate.getFullYear()}-01-01`
  const yearEndStr = `${todayDate.getFullYear()}-12-31`
  
  // Next 7 days range
  const next7 = new Date(todayDate)
  next7.setDate(todayDate.getDate() + 7)
  const next7Str = next7.toISOString().slice(0, 10)
  
  // Run all queries in parallel
  const [
    totalStudents,
    activeStudents,
    sessionsToday,
    sessionsThisWeek,
    sessionsThisMonth,
    paymentsThisMonth,
    paymentsThisYear,
    upcomingSessions,
    statusGroups,
    subjectGroups,
    allPaymentsForTrend,
    allPaymentsForTop,
    unbilledSessions,
    cancelledByTeacher,
  ] = await Promise.all([
    db.student.count({ where: { userId, archived: false } }),
    db.student.count({ where: { userId, archived: false, status: 'active' } }),
    db.session.count({ where: { userId, date: today } }),
    db.session.count({
      where: { userId, date: { gte: weekStartStr, lte: weekEndStr } }
    }),
    db.session.count({
      where: { userId, date: { gte: monthStartStr, lte: monthEndStr } }
    }),
    db.payment.aggregate({
      where: { userId, date: { gte: monthStartStr, lte: monthEndStr } },
      _sum: { amount: true },
      _count: true,
    }),
    db.payment.aggregate({
      where: { userId, date: { gte: yearStartStr, lte: yearEndStr } },
      _sum: { amount: true },
      _count: true,
    }),
    db.session.findMany({
      where: {
        userId,
        date: { gte: today, lte: next7Str },
        status: 'scheduled',
        // Only show upcoming sessions for active, non-blocked, non-archived students
        student: {
          status: 'active',
          archived: false,
          blocked: false,
        }
      },
      include: {
        student: {
          select: { id: true, name: true, subject: true, grade: true, stream: true, locationId: true, locationRec: { select: { name: true, lat: true, lng: true } } }
        }
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      take: 30,
    }),
    db.session.groupBy({
      by: ['status'],
      where: { userId, date: { gte: monthStartStr, lte: monthEndStr } },
      _count: true,
    }),
    db.student.groupBy({
      by: ['subject'],
      where: { userId, archived: false },
      _count: true,
    }),
    db.payment.findMany({
      where: { userId },
      select: { amount: true, date: true },
      orderBy: { date: 'desc' },
      take: 500,
    }),
    db.payment.findMany({
      where: { userId, date: { gte: yearStartStr, lte: yearEndStr } },
      include: {
        student: { select: { id: true, name: true, subject: true } }
      },
      orderBy: { date: 'desc' },
      take: 500,
    }),
    db.session.findMany({
      where: {
        userId,
        status: 'completed',
        billed: false,
        isHistorical: false,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            subject: true,
            grade: true,
            billingType: true,
            billingN: true,
            pricePerSession: true,
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 200,
    }),
    db.session.count({
      where: { userId, status: 'cancelled_by_teacher', date: { gte: monthStartStr, lte: monthEndStr } }
    }),
  ])
  
  // Build monthly revenue trend (last 6 months)
  const trend: { month: string; revenue: number; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(todayDate.getFullYear(), todayDate.getMonth() - i, 1)
    const mStart = d.toISOString().slice(0, 10)
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
    const monthPayments = allPaymentsForTrend.filter(p => p.date >= mStart && p.date <= mEnd)
    const revenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    trend.push({
      month: d.toLocaleDateString('ar-SA-u-ca-gregory', { month: 'long' }),
      revenue,
      count: monthPayments.length,
    })
  }
  
  // Build top students by revenue
  const studentRevenueMap = new Map<string, { name: string; subject: string; total: number; count: number }>()
  for (const p of allPaymentsForTop) {
    const sid = p.studentId
    const existing = studentRevenueMap.get(sid) || {
      name: p.student?.name || '—',
      subject: p.student?.subject || '',
      total: 0,
      count: 0,
    }
    existing.total += p.amount || 0
    existing.count += 1
    studentRevenueMap.set(sid, existing)
  }
  const topStudents = Array.from(studentRevenueMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  
  // Build unbilled summary per student (only for per_n billing type)
  const unbilledMap = new Map<string, { studentId: string; name: string; subject: string; grade: string; billingType: string; billingN: number; pricePerSession: number; count: number; amount: number; sessions: { id: string; date: string }[] }>()
  for (const s of unbilledSessions) {
    // Skip sessions for monthly-billing students (they're billed by month, not by session)
    // But we'll still report them so the teacher can see what's pending
    const sid = s.studentId
    const existing = unbilledMap.get(sid) || {
      studentId: sid,
      name: s.student.name,
      subject: s.student.subject,
      grade: s.student.grade,
      billingType: s.student.billingType,
      billingN: s.student.billingN,
      pricePerSession: s.student.pricePerSession,
      count: 0,
      amount: 0,
      sessions: [],
    }
    existing.count += 1
    existing.amount += s.student.pricePerSession
    existing.sessions.push({ id: s.id, date: s.date })
    unbilledMap.set(sid, existing)
  }
  const unbilled = Array.from(unbilledMap.values()).sort((a, b) => b.amount - a.amount)
  
  return NextResponse.json({
    today,
    weekRange: { start: weekStartStr, end: weekEndStr },
    monthRange: { start: monthStartStr, end: monthEndStr },
    counts: {
      totalStudents,
      activeStudents,
      sessionsToday,
      sessionsThisWeek,
      sessionsThisMonth,
      paymentsThisMonth: paymentsThisMonth._count,
      paymentsThisYear: paymentsThisYear._count,
      cancelledByTeacherThisMonth: cancelledByTeacher,
    },
    revenue: {
      thisMonth: paymentsThisMonth._sum.amount || 0,
      thisYear: paymentsThisYear._sum.amount || 0,
    },
    upcoming: upcomingSessions,
    byStatus: statusGroups,
    bySubject: subjectGroups,
    monthlyTrend: trend,
    topStudents,
    unbilled,
  })
}
