import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId, ensureUser } from '@/lib/auth'
import { safeJsonParse, generateUpcomingDates, todayStr } from '@/lib/solafios'

// POST /api/sessions/generate
// Auto-generate upcoming sessions from each student's weekly schedule.
// Body: { weeks?: number, fromDate?: 'YYYY-MM-DD', onlyActive?: boolean, dryRun?: boolean }

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    await ensureUser()
    return NextResponse.json({ error: 'no user — initialized' }, { status: 500 })
  }
  
  const body = await req.json().catch(() => ({}))
  const weeksAhead: number = Number(body.weeks) || 4
  const fromDate: string = body.fromDate || todayStr()
  const onlyActive: boolean = body.onlyActive !== false
  const dryRun: boolean = !!body.dryRun
  
  // Get all students with weekly schedule
  const students = await db.student.findMany({
    where: {
      userId,
      archived: false,
      ...(onlyActive ? { status: 'active' } : {}),
    }
  })
  
  // Get existing sessions in the date range (to skip duplicates)
  const toDate = new Date(fromDate + 'T00:00:00')
  toDate.setDate(toDate.getDate() + weeksAhead * 7)
  const toDateStr = toDate.toISOString().slice(0, 10)
  
  const existing = await db.session.findMany({
    where: {
      userId,
      date: { gte: fromDate, lte: toDateStr }
    },
    select: { studentId: true, date: true, time: true }
  })
  
  // Index existing sessions by `${studentId}|${date}|${time}` to skip duplicates
  const existingSet = new Set(existing.map(s => `${s.studentId}|${s.date}|${s.time}`))
  
  // Get holidays to skip
  const holidays = await db.holiday.findMany({
    where: { userId },
    select: { startDate: true, endDate: true, stream: true }
  })
  
  const toCreate: { studentId: string; date: string; time: string }[] = []
  
  for (const student of students) {
    const weeklySchedule = safeJsonParse<{ day: number; time: string }[]>(
      student.weeklySchedule,
      []
    )
    if (weeklySchedule.length === 0) continue
    
    const startDate = new Date(fromDate + 'T00:00:00')
    const upcoming = generateUpcomingDates(weeklySchedule, weeksAhead, startDate)
    
    for (const up of upcoming) {
      // Skip if already exists
      const key = `${student.id}|${up.date}|${up.time}`
      if (existingSet.has(key)) continue
      
      // Skip if holiday
      const isHoliday = holidays.some(h => up.date >= h.startDate && up.date <= h.endDate)
      if (isHoliday) continue
      
      toCreate.push({ studentId: student.id, date: up.date, time: up.time })
    }
  }
  
  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      wouldCreate: toCreate.length,
      items: toCreate,
    })
  }
  
  if (toCreate.length === 0) {
    return NextResponse.json({ created: 0, message: 'لا توجد جلسات جديدة للإنشاء' })
  }
  
  const created = await db.$transaction(
    toCreate.map(s => db.session.create({
      data: {
        userId,
        studentId: s.studentId,
        date: s.date,
        time: s.time,
        status: 'scheduled',
      }
    }))
  )
  
  return NextResponse.json({ created: created.length, items: created })
}
