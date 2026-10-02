import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  
  const existing = await db.payment.findUnique({
    where: { id },
    include: { sessions: true }
  })
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })
  
  // Unlink previously linked sessions if sessionIds is changing
  const newSessionIds: string[] | undefined = Array.isArray(body.sessionIds) ? body.sessionIds : undefined
  
  if (newSessionIds !== undefined) {
    const oldSessionIds = existing.sessions.map(s => s.id)
    const toUnlink = oldSessionIds.filter(sid => !newSessionIds.includes(sid))
    const toLink = newSessionIds.filter(sid => !oldSessionIds.includes(sid))
    
    if (toUnlink.length > 0) {
      await db.session.updateMany({
        where: { id: { in: toUnlink } },
        data: { billed: false, paymentId: null }
      })
    }
    if (toLink.length > 0) {
      await db.session.updateMany({
        where: { id: { in: toLink } },
        data: { billed: true, paymentId: id }
      })
    }
  }
  
  const updated = await db.payment.update({
    where: { id },
    data: {
      amount: body.amount !== undefined ? Number(body.amount) : existing.amount,
      type: body.type ?? existing.type,
      date: body.date ?? existing.date,
      notes: body.notes === undefined ? existing.notes : (body.notes || null),
      sessionIds: newSessionIds !== undefined ? JSON.stringify(newSessionIds) : existing.sessionIds,
      sessionCount: newSessionIds !== undefined ? newSessionIds.length : existing.sessionCount,
      isHistorical: body.isHistorical !== undefined ? Boolean(body.isHistorical) : existing.isHistorical,
      sessions: newSessionIds !== undefined ? { set: newSessionIds.map(sid => ({ id: sid })) } : undefined,
    }
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  // Unlink sessions before deleting
  await db.session.updateMany({
    where: { paymentId: id },
    data: { billed: false, paymentId: null }
  })
  
  await db.payment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
