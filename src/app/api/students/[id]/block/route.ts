import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/students/[id]/block
// Body: { blocked: boolean }
// Toggles student block status

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const blocked = !!body.blocked
  
  const updated = await db.student.update({
    where: { id },
    data: { blocked }
  })
  return NextResponse.json(updated)
}
