import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const existing = await db.holiday.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })
  
  const updated = await db.holiday.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      kind: body.kind ?? existing.kind,
      stream: body.stream ?? existing.stream,
      startDate: body.startDate ?? existing.startDate,
      endDate: body.endDate ?? existing.endDate,
    }
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.holiday.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
