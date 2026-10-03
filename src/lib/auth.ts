// Helper to get the current user's id.
// In a single-teacher app like Solafios, we use the first user.
// If you want multi-teacher support later, replace this with NextAuth session logic.

import { db } from '@/lib/db'

export async function getCurrentUserId(): Promise<string | null> {
  const user = await db.user.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  return user?.id ?? null
}

export async function getCurrentUser() {
  return await db.user.findFirst({
    orderBy: { createdAt: 'asc' },
  })
}

export async function ensureUser() {
  let user = await db.user.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!user) {
    user = await db.user.create({
      data: {
        email: 'solafios@local',
        name: 'Solafios Teacher',
      }
    })
  }
  return user
}
