import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json([])
  const families = await db.family.findMany({
    where: { userId },
    include: {
      _count: { select: { students: true } }
    },
    orderBy: { primaryName: 'asc' }
  })
  return NextResponse.json(families)
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'no user' }, { status: 500 })
  const body = await req.json()
  const family = await db.family.create({
    data: {
      userId,
      primaryName: body.primaryName || '',
      primaryPhone: body.primaryPhone || null,
      siblingDiscount: Number(body.siblingDiscount) || 0,
      notes: body.notes || null,
    }
  })
  return NextResponse.json(family)
}
