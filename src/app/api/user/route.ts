import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// GET /api/user — returns the current user (teacher) info
export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json(null)
  const user = await db.user.findUnique({ where: { id: userId } })
  return NextResponse.json(user)
}

// PUT /api/user — update teacher profile (bank info, name, profit margin)
export async function PUT(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'no user' }, { status: 500 })
  
  const body = await req.json()
  const existing = await db.user.findUnique({ where: { id: userId } })
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })
  
  const updated = await db.user.update({
    where: { id: userId },
    data: {
      name: body.name ?? existing.name,
      email: body.email ?? existing.email,
      iban: body.iban === undefined ? existing.iban : (body.iban || null),
      bankAccount: body.bankAccount === undefined ? existing.bankAccount : (body.bankAccount || null),
      bankName: body.bankName === undefined ? existing.bankName : (body.bankName || null),
      beneficiaryName: body.beneficiaryName === undefined ? existing.beneficiaryName : (body.beneficiaryName || null),
      expectedProfitMargin: body.expectedProfitMargin !== undefined ? Number(body.expectedProfitMargin) : existing.expectedProfitMargin,
    }
  })
  return NextResponse.json(updated)
}
