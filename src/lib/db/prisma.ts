import { PrismaClient } from '@prisma/client'

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
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Disconnect from the database
 * Use this in scripts or serverless functions that need to cleanup
 */
export async function disconnect() {
  await prisma.$disconnect()
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
