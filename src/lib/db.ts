import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Use Prisma + pg adapter for serverless environments (Vercel)
// The pg adapter uses Node.js for DB connections (more reliable in serverless)
// than Prisma's default Rust engine.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pgPool: Pool | undefined
}

// Singleton pool — reused across serverless function invocations
if (!globalForPrisma.pgPool) {
  globalForPrisma.pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15000,
    max: 2,
    idleTimeoutMillis: 30000,
    ssl: false,
  })
}

if (!globalForPrisma.prisma) {
  const adapter = new PrismaPg(globalForPrisma.pgPool)
  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: ['error'],
  })
}

export const db = globalForPrisma.prisma
