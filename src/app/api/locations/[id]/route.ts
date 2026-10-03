import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const existing = await db.location.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })
  
  const updated = await db.location.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      address: body.address === undefined ? existing.address : (body.address || null),
      lat: body.lat !== undefined ? (body.lat ? Number(body.lat) : null) : existing.lat,
      lng: body.lng !== undefined ? (body.lng ? Number(body.lng) : null) : existing.lng,
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
    where: { locationId: id },
    data: { locationId: null }
  })
  await db.location.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
