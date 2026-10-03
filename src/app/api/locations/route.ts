import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json([])
  const locations = await db.location.findMany({
    where: { userId },
    include: { _count: { select: { students: true } } },
    orderBy: { name: 'asc' }
  })
  return NextResponse.json(locations)
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'no user' }, { status: 500 })
  const body = await req.json()
  const loc = await db.location.create({
    data: {
      userId,
      name: body.name || '',
      address: body.address || null,
      lat: body.lat ? Number(body.lat) : null,
      lng: body.lng ? Number(body.lng) : null,
    }
  })
  return NextResponse.json(loc)
}
