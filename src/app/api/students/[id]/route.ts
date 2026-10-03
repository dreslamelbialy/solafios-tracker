import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeJsonParse } from '@/lib/solafios'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const student = await db.student.findUnique({
    where: { id },
    include: {
      family: true,
      year: true,
      locationRec: true,
      sessions: {
        orderBy: { date: 'desc' },
        take: 100,
      },
      payments: {
        orderBy: { date: 'desc' },
        take: 50,
        include: {
          sessions: {
            select: { id: true, date: true, time: true, status: true }
          }
        }
      },
      _count: { select: { sessions: true, payments: true } }
    }
  })
  if (!student) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(student)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  
  const existing = await db.student.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })
  
  const updated = await db.student.update({
    where: { id },
    data: {
      familyId: body.familyId === undefined ? existing.familyId : (body.familyId || null),
      yearId: body.yearId === undefined ? existing.yearId : (body.yearId || null),
      locationId: body.locationId === undefined ? existing.locationId : (body.locationId || null),
      name: body.name ?? existing.name,
      subject: body.subject ?? existing.subject,
      grade: body.grade ?? existing.grade,
      stream: body.stream ?? existing.stream,
      pricePerSession: body.pricePerSession !== undefined ? Number(body.pricePerSession) : existing.pricePerSession,
      billingType: body.billingType ?? existing.billingType,
      billingN: body.billingN !== undefined ? Number(body.billingN) : existing.billingN,
      weeklyDays: body.weeklyDays !== undefined ? (typeof body.weeklyDays === 'string' ? body.weeklyDays : JSON.stringify(body.weeklyDays)) : existing.weeklyDays,
      sessionTime: body.sessionTime ?? existing.sessionTime,
      weeklySchedule: body.weeklySchedule !== undefined ? (typeof body.weeklySchedule === 'string' ? body.weeklySchedule : JSON.stringify(body.weeklySchedule)) : existing.weeklySchedule,
      phone: body.phone ?? existing.phone,
      notes: body.notes ?? existing.notes,
      syllabusTarget: body.syllabusTarget !== undefined ? (typeof body.syllabusTarget === 'string' ? body.syllabusTarget : JSON.stringify(body.syllabusTarget)) : existing.syllabusTarget,
      status: body.status ?? existing.status,
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
  await db.student.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
