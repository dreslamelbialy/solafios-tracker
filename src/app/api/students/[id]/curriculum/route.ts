import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/students/[id]/curriculum
// Body: { curriculumProgress: [...], evaluation: string }
// Updates the student's curriculum progress and evaluation

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
      curriculumProgress: body.curriculumProgress !== undefined
        ? (typeof body.curriculumProgress === 'string' ? body.curriculumProgress : JSON.stringify(body.curriculumProgress))
        : existing.curriculumProgress,
      evaluation: body.evaluation !== undefined ? (body.evaluation || '') : existing.evaluation,
    }
  })
  return NextResponse.json(updated)
}
