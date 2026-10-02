import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json([])
  
  const { searchParams } = new URL(req.url)
  const fromDate = searchParams.get('from')
  const toDate = searchParams.get('to')
  const stream = searchParams.get('stream')
  
  const holidays = await db.holiday.findMany({
    where: {
      userId,
      ...(fromDate ? { startDate: { gte: fromDate } } : {}),
      ...(toDate ? { endDate: { lte: toDate } } : {}),
      ...(stream && stream !== 'all' ? { OR: [{ stream }, { stream: 'all' }] } : {}),
    },
    orderBy: { startDate: 'asc' }
  })
  return NextResponse.json(holidays)
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'no user' }, { status: 500 })
  const body = await req.json()
  
  // Bulk create
  if (Array.isArray(body)) {
    const created = await db.$transaction(
      body.map(h => db.holiday.create({
        data: {
          userId,
          title: h.title || '',
          kind: h.kind || 'holiday',
          stream: h.stream || 'ministry',
          startDate: h.startDate,
          endDate: h.endDate || h.startDate,
        }
      }))
    )
    return NextResponse.json(created)
  }
  
  const holiday = await db.holiday.create({
    data: {
      userId,
      title: body.title || '',
      kind: body.kind || 'holiday',
      stream: body.stream || 'ministry',
      startDate: body.startDate,
      endDate: body.endDate || body.startDate,
    }
  })
  return NextResponse.json(holiday)
}
