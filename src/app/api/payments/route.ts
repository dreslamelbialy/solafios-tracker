import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json([])
  
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  
  const payments = await db.payment.findMany({
    where: {
      userId,
      ...(studentId ? { studentId } : {}),
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          subject: true,
          grade: true,
          phone: true,
        }
      },
      sessions: {
        select: {
          id: true,
          date: true,
          time: true,
          status: true,
        }
      }
    },
    orderBy: { date: 'desc' }
  })
  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'no user' }, { status: 500 })
  
  const body = await req.json()
  
  // Create payment + link sessions
  const sessionIds: string[] = Array.isArray(body.sessionIds) ? body.sessionIds : []
  
  const payment = await db.payment.create({
    data: {
      userId,
      studentId: body.studentId,
      amount: Number(body.amount) || 0,
      type: body.type || 'full',
      date: body.date,
      notes: body.notes || null,
      sessionIds: JSON.stringify(sessionIds),
      sessionCount: sessionIds.length,
      isHistorical: body.isHistorical || false,
      // Link sessions via relation
      sessions: sessionIds.length > 0 ? {
        connect: sessionIds.map(id => ({ id }))
      } : undefined,
    },
    include: { sessions: true }
  })
  
  // Mark linked sessions as billed
  if (sessionIds.length > 0) {
    await db.session.updateMany({
      where: { id: { in: sessionIds } },
      data: { billed: true, paymentId: payment.id }
    })
  }
  
  return NextResponse.json(payment)
}
