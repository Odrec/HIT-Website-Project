/**
 * Type-safe environment variable access
 *
 * This module provides validated access to environment variables with
 * proper typing and runtime validation.
 */

// Server-side environment variables (not exposed to client)
const serverEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NODE_ENV: process.env.NODE_ENV,
} as const

// Client-side environment variables (prefixed with NEXT_PUBLIC_)
const clientEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
} as const

/**
 * Validate that all required environment variables are set
 * Call this at application startup
 */
export function validateEnv(): void {
  const requiredServerVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'] as const
  const requiredClientVars = ['NEXT_PUBLIC_APP_URL'] as const

  const missingServerVars = requiredServerVars.filter((key) => !serverEnv[key])
  const missingClientVars = requiredClientVars.filter((key) => !clientEnv[key])

  const allMissing = [...missingServerVars, ...missingClientVars]

  if (allMissing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${allMissing.join(', ')}\n` +
        'Please check your .env.local file and ensure all required variables are set.'
    )
  }
}

/**
 * Get server-side environment variables
 * Only use this in server-side code (API routes, server components)
 */
export function getServerEnv() {
  // Only validate in production to allow partial configs in development
  if (process.env.NODE_ENV === 'production') {
    validateEnv()
  }

  return {
    databaseUrl: serverEnv.DATABASE_URL!,
    redisUrl: serverEnv.REDIS_URL || 'redis://localhost:6379',
    nextAuthSecret: serverEnv.NEXTAUTH_SECRET!,
    nodeEnv: serverEnv.NODE_ENV || 'development',
    isProduction: serverEnv.NODE_ENV === 'production',
    isDevelopment: serverEnv.NODE_ENV === 'development',
  }
}

/**
 * Get client-side environment variables
 * Safe to use in client-side code
 */
export function getClientEnv() {
  return {
    appUrl: clientEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  }
}

/**
 * Type definitions for environment variables
 */
export type ServerEnv = ReturnType<typeof getServerEnv>
export type ClientEnv = ReturnType<typeof getClientEnv>
