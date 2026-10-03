import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json([])
  
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  const fromDate = searchParams.get('from')
  const toDate = searchParams.get('to')
  const status = searchParams.get('status')
  const date = searchParams.get('date')
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 500
  
  const sessions = await db.session.findMany({
    where: {
      userId,
      ...(studentId ? { studentId } : {}),
      ...(fromDate ? { date: { gte: fromDate } } : {}),
      ...(toDate ? { date: { lte: toDate } } : {}),
      ...(date ? { date } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          subject: true,
          grade: true,
          stream: true,
          pricePerSession: true,
          billingType: true,
          billingN: true,
          phone: true,
          familyId: true,
          locationId: true,
        }
      },
      payment: { select: { id: true, amount: true, date: true, type: true } }
    },
    orderBy: [
      { date: 'desc' },
      { time: 'desc' }
    ],
    take: limit,
  })
  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'no user' }, { status: 500 })
  
  const body = await req.json()
  
  // Single create or bulk create
  if (Array.isArray(body)) {
    const created = await db.$transaction(
      body.map(s => db.session.create({
        data: {
          userId,
          studentId: s.studentId,
          date: s.date,
          time: s.time || '16:00',
          status: s.status || 'scheduled',
          cancelReason: s.cancelReason || null,
          cancelledBy: s.cancelledBy || null,
          owedMakeup: s.owedMakeup || false,
          chargedToParent: s.chargedToParent || false,
          topic: s.topic || '',
          homework: s.homework || '',
          billed: s.billed || false,
          paymentId: s.paymentId || null,
          isExtra: s.isExtra || false,
          isHistorical: s.isHistorical || false,
        }
      }))
    )
    return NextResponse.json(created)
  }
  
  const session = await db.session.create({
    data: {
      userId,
      studentId: body.studentId,
      date: body.date,
      time: body.time || '16:00',
      status: body.status || 'scheduled',
      cancelReason: body.cancelReason || null,
      cancelledBy: body.cancelledBy || null,
      owedMakeup: body.owedMakeup || false,
      chargedToParent: body.chargedToParent || false,
      topic: body.topic || '',
      homework: body.homework || '',
      billed: body.billed || false,
      paymentId: body.paymentId || null,
      isExtra: body.isExtra || false,
      isHistorical: body.isHistorical || false,
    }
  })
  return NextResponse.json(session)
}
