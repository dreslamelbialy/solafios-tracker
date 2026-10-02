import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId, ensureUser } from '@/lib/auth'
import { safeJsonParse, todayStr } from '@/lib/solafios'

// POST /api/sessions/generate
// Auto-generate upcoming sessions from each student's weekly schedule.
// Body: { weeks?: number, fromDate?: 'YYYY-MM-DD', untilDate?: 'YYYY-MM-DD', onlyActive?: boolean, dryRun?: boolean }
//
// Default behavior: generate until the END of the current academic year (not just N weeks).
// Sessions are skipped on:
//   - existing sessions (same studentId+date+time)
//   - holidays (any stream overlapping the student's stream or "all")
//   - dates after the academic year's endDate (if a year is set on the student)

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    await ensureUser()
    return NextResponse.json({ error: 'no user — initialized' }, { status: 500 })
  }
  
  const body = await req.json().catch(() => ({}))
  const fromDate: string = body.fromDate || todayStr()
  const onlyActive: boolean = body.onlyActive !== false
  const dryRun: boolean = !!body.dryRun
  
  // Determine the end date:
  //   1. If body.untilDate is provided → use it
  //   2. Otherwise, find the active academic year's endDate
  //   3. Otherwise, default to 6 months ahead
  let untilDate: string | undefined = body.untilDate
  if (!untilDate) {
    const activeYear = await db.academicYear.findFirst({
      where: { userId, archived: false },
      orderBy: { endDate: 'desc' }
    })
    if (activeYear?.endDate) {
      untilDate = activeYear.endDate
    } else {
      const d = new Date(fromDate + 'T00:00:00')
      d.setMonth(d.getMonth() + 6)
      untilDate = d.toISOString().slice(0, 10)
    }
  }
  
  // Get all students with weekly schedule
  const students = await db.student.findMany({
    where: {
      userId,
      archived: false,
      ...(onlyActive ? { status: 'active' } : {}),
    }
  })
  
  // Get existing sessions in the date range (to skip duplicates)
  const existing = await db.session.findMany({
    where: {
      userId,
      date: { gte: fromDate, lte: untilDate }
    },
    select: { studentId: true, date: true, time: true }
  })
  const existingSet = new Set(existing.map(s => `${s.studentId}|${s.date}|${s.time}`))
  
  // Get holidays to skip
  const holidays = await db.holiday.findMany({
    where: { userId },
    select: { startDate: true, endDate: true, stream: true }
  })
  
  // Get academic years per student to determine their personal end date
  const yearsMap = new Map<string, string>()
  const allYears = await db.academicYear.findMany({ where: { userId } })
  for (const y of allYears) yearsMap.set(y.id, y.endDate)
  
  // Helper: check if a date is in a holiday for the given student stream
  const isHolidayFor = (dateStr: string, stream: string) => {
    return holidays.some(h => {
      if (dateStr < h.startDate || dateStr > h.endDate) return false
      // holiday applies if stream is "all" OR matches student's stream OR student is "all"
      return h.stream === 'all' || h.stream === stream || stream === 'all'
    })
  }
  
  const toCreate: { studentId: string; date: string; time: string }[] = []
  const skippedHoliday: { studentId: string; date: string; time: string }[] = []
  
  for (const student of students) {
    const weeklySchedule = safeJsonParse<{ day: number; time: string }[]>(
      student.weeklySchedule,
      []
    )
    if (weeklySchedule.length === 0) continue
    
    // Determine this student's personal end date (year.endDate if set, else global untilDate)
    const studentEndDate = student.yearId ? (yearsMap.get(student.yearId) || untilDate) : untilDate
    
    // Iterate week by week from fromDate to studentEndDate
    const startD = new Date(fromDate + 'T00:00:00')
    startD.setHours(0, 0, 0, 0)
    const endD = new Date(studentEndDate + 'T00:00:00')
    endD.setHours(23, 59, 59, 999)
    
    // Limit to 52 weeks max (1 year) to avoid runaway loops
    const maxWeeks = 52
    for (let week = 0; week < maxWeeks; week++) {
      let anyInFuture = false
      for (const sched of weeklySchedule) {
        const d = new Date(startD)
        const currentDay = d.getDay()
        const diff = (sched.day - currentDay + 7) % 7
        d.setDate(d.getDate() + diff + week * 7)
        
        if (d > endD) continue
        if (d < startD) continue
        anyInFuture = true
        
        const dateStr = d.toISOString().slice(0, 10)
        const key = `${student.id}|${dateStr}|${sched.time}`
        if (existingSet.has(key)) continue
        
        if (isHolidayFor(dateStr, student.stream)) {
          skippedHoliday.push({ studentId: student.id, date: dateStr, time: sched.time })
          continue
        }
        
        toCreate.push({ studentId: student.id, date: dateStr, time: sched.time })
        existingSet.add(key) // avoid dupes within the loop
      }
      // If no upcoming date this week is in range, we can stop
      const probe = new Date(startD)
      probe.setDate(probe.getDate() + week * 7 + 7)
      if (probe > endD) break
    }
  }
  
  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      fromDate,
      untilDate,
      wouldCreate: toCreate.length,
      skippedOnHolidays: skippedHoliday.length,
      items: toCreate.slice(0, 50),
    })
  }
  
  if (toCreate.length === 0) {
    return NextResponse.json({
      created: 0,
      skippedOnHolidays: skippedHoliday.length,
      message: 'لا توجد جلسات جديدة للإنشاء'
    })
  }
  
  // Bulk insert (chunk to avoid SQLite parameter limits)
  const CHUNK_SIZE = 100
  let totalCreated = 0
  for (let i = 0; i < toCreate.length; i += CHUNK_SIZE) {
    const chunk = toCreate.slice(i, i + CHUNK_SIZE)
    const result = await db.$transaction(
      chunk.map(s => db.session.create({
        data: {
          userId,
          studentId: s.studentId,
          date: s.date,
          time: s.time,
          status: 'scheduled',
        }
      }))
    )
    totalCreated += result.length
  }
  
  return NextResponse.json({
    created: totalCreated,
    skippedOnHolidays: skippedHoliday.length,
    fromDate,
    untilDate,
  })
}
