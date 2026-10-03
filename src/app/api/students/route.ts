import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json([])
  
  const students = await db.student.findMany({
    where: { userId },
    include: {
      family: true,
      year: true,
      locationRec: true,
      _count: { select: { sessions: true, payments: true } }
    },
    orderBy: [
      { archived: 'asc' },
      { name: 'asc' }
    ]
  })
  return NextResponse.json(students)
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'no user' }, { status: 500 })
  
  const body = await req.json()
  
  const student = await db.student.create({
    data: {
      userId,
      familyId: body.familyId || null,
      yearId: body.yearId || null,
      locationId: body.locationId || null,
      name: body.name || '',
      subject: body.subject || 'Chemistry',
      grade: body.grade || '',
      stream: body.stream || 'international',
      pricePerSession: Number(body.pricePerSession) || 0,
      billingType: body.billingType || 'per_n',
      billingN: Number(body.billingN) || 4,
      weeklyDays: JSON.stringify(body.weeklyDays || []),
      sessionTime: body.sessionTime || '16:00',
      weeklySchedule: JSON.stringify(body.weeklySchedule || []),
      phone: body.phone || '',
      notes: body.notes || '',
      syllabusTarget: JSON.stringify(body.syllabusTarget || []),
      status: body.status || 'active',
      archived: body.archived || false,
    }
  })
  return NextResponse.json(student)
}
