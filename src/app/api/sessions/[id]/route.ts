import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  
  const existing = await db.session.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })
  
  const updated = await db.session.update({
    where: { id },
    data: {
      date: body.date ?? existing.date,
      time: body.time ?? existing.time,
      status: body.status ?? existing.status,
      cancelReason: body.cancelReason === undefined ? existing.cancelReason : (body.cancelReason || null),
      cancelledBy: body.cancelledBy === undefined ? existing.cancelledBy : (body.cancelledBy || null),
      owedMakeup: body.owedMakeup !== undefined ? Boolean(body.owedMakeup) : existing.owedMakeup,
      chargedToParent: body.chargedToParent !== undefined ? Boolean(body.chargedToParent) : existing.chargedToParent,
      topic: body.topic ?? existing.topic,
      homework: body.homework ?? existing.homework,
      billed: body.billed !== undefined ? Boolean(body.billed) : existing.billed,
      paymentId: body.paymentId === undefined ? existing.paymentId : (body.paymentId || null),
      isExtra: body.isExtra !== undefined ? Boolean(body.isExtra) : existing.isExtra,
      isHistorical: body.isHistorical !== undefined ? Boolean(body.isHistorical) : existing.isHistorical,
    }
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.session.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
