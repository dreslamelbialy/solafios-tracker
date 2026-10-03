import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const existing = await db.family.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })
  
  const updated = await db.family.update({
    where: { id },
    data: {
      primaryName: body.primaryName ?? existing.primaryName,
      primaryPhone: body.primaryPhone === undefined ? existing.primaryPhone : (body.primaryPhone || null),
      siblingDiscount: body.siblingDiscount !== undefined ? Number(body.siblingDiscount) : existing.siblingDiscount,
      notes: body.notes === undefined ? existing.notes : (body.notes || null),
    }
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // Detach students from this family first
  await db.student.updateMany({
    where: { familyId: id },
    data: { familyId: null }
  })
  await db.family.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
