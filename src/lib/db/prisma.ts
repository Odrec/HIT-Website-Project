import { PrismaClient } from '.prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/**
 * Prisma Client singleton for database access
 *
 * This prevents multiple instances of Prisma Client in development
 * which can happen due to hot-reloading.
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Create pg pool if not already created
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL || 'postgresql://hit_user:hit_password@localhost:5432/hit_db',
  })

// Create adapter
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.pool = pool
}

/**
 * Disconnect from the database
 * Use this in scripts or serverless functions that need to cleanup
 */
export async function disconnect() {
  await prisma.$disconnect()
  await pool.end()
}

/**
 * Health check for database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

export default prisma
