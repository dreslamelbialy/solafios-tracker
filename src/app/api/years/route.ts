import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json([])
  const years = await db.academicYear.findMany({
    where: { userId },
    include: { _count: { select: { students: true } } },
    orderBy: { startDate: 'desc' }
  })
  return NextResponse.json(years)
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'no user' }, { status: 500 })
  const body = await req.json()
  const year = await db.academicYear.create({
    data: {
      userId,
      label: body.label || '',
      startDate: body.startDate,
      endDate: body.endDate,
      archived: body.archived || false,
    }
  })
  return NextResponse.json(year)
}
