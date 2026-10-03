import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { todayStr } from '@/lib/solafios'

// POST /api/students/[id]/pause-course
// Pauses the student's course and deletes all upcoming scheduled sessions.
// Body: { paused: boolean }
//   - paused: true  → set status='paused' + delete future 'scheduled' sessions
//   - paused: false → set status='active' (sessions will be regenerated on next generate call)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const paused = !!body.paused
  const today = todayStr()
  
  const existing = await db.student.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })
  
  if (paused) {
    // Pause: set status to 'paused' and delete all upcoming scheduled sessions
    const deleted = await db.session.deleteMany({
      where: {
        studentId: id,
        status: 'scheduled',
        date: { gte: today },
      }
    })
    
    const updated = await db.student.update({
      where: { id },
      data: { status: 'paused' }
    })
    
    return NextResponse.json({
      ok: true,
      paused: true,
      deletedSessions: deleted.count,
      student: updated,
    })
  } else {
    // Resume: set status to 'active' (sessions need to be regenerated manually)
    const updated = await db.student.update({
      where: { id },
      data: { status: 'active' }
    })
    
    return NextResponse.json({
      ok: true,
      paused: false,
      message: 'تم استئناف الكورس. شغل "توليد الجلسات" من الإعدادات لإعادة المواعيد القادمة.',
      student: updated,
    })
  }
}
