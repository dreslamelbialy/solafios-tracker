import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const existing = await db.academicYear.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })
  
  const updated = await db.academicYear.update({
    where: { id },
    data: {
      label: body.label ?? existing.label,
      startDate: body.startDate ?? existing.startDate,
      endDate: body.endDate ?? existing.endDate,
      archived: body.archived !== undefined ? Boolean(body.archived) : existing.archived,
    }
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.student.updateMany({
    where: { yearId: id },
    data: { yearId: null }
  })
  await db.academicYear.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
