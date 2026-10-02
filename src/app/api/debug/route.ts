import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  const hasDbUrl = !!dbUrl
  const urlStart = dbUrl ? dbUrl.slice(0, 30) + '...' : 'NOT SET'
  
  // Try to import and connect to Prisma
  let prismaStatus = 'unknown'
  let prismaError: string | null = null
  
  try {
    const { db } = await import('@/lib/db')
    // Simple query
    await db.$queryRaw`SELECT 1 as test`
    prismaStatus = 'connected'
  } catch (e) {
    prismaStatus = 'failed'
    prismaError = e instanceof Error ? e.message : String(e)
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL_set: hasDbUrl,
      DATABASE_URL_preview: urlStart,
      NODE_ENV: process.env.NODE_ENV,
    },
    prisma: {
      status: prismaStatus,
      error: prismaError,
    },
  })
}
