/**
 * Rate Limiting Utility
 *
 * Provides rate limiting functionality using Redis for distributed environments.
 * Falls back to in-memory limiting when Redis is unavailable.
 *
 * @module rate-limit
 */

import { NextRequest, NextResponse } from 'next/server'
import redis, { isRedisConnected } from '@/lib/cache/redis'

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Time window in seconds */
  windowSeconds: number
  /** Optional custom key prefix */
  keyPrefix?: string
  /** Whether to include response headers */
  includeHeaders?: boolean
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Current request count in the window */
  current: number
  /** Maximum requests allowed */
  limit: number
  /** Seconds until the window resets */
  remaining: number
  /** Unix timestamp when the window resets */
  resetTime: number
}

/**
 * In-memory rate limit store for fallback
 */
const inMemoryStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Default rate limit configurations for different API types
 */
export const RateLimitPresets = {
  /** Standard API rate limit - 100 requests per minute */
  STANDARD: {
    maxRequests: 100,
    windowSeconds: 60,
    keyPrefix: 'rl:std',
  },

  /** Strict rate limit for sensitive endpoints - 10 requests per minute */
  STRICT: {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'rl:strict',
  },

  /** Lenient rate limit for public read endpoints - 200 requests per minute */
  LENIENT: {
    maxRequests: 200,
    windowSeconds: 60,
    keyPrefix: 'rl:lenient',
  },

  /** Auth rate limit - 5 attempts per 15 minutes */
  AUTH: {
    maxRequests: 5,
    windowSeconds: 900, // 15 minutes
    keyPrefix: 'rl:auth',
  },

  /** Search rate limit - 30 requests per minute */
  SEARCH: {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: 'rl:search',
  },
} as const

/**
 * Extract client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get forwarded IP (for proxied requests)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  // Fall back to connecting IP
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Last resort - use a hash of user agent and other headers
  const ua = request.headers.get('user-agent') || 'unknown'
  return `ua:${ua.substring(0, 50)}`
}

/**
 * Check rate limit using Redis
 */
async function checkRateLimitRedis(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - config.windowSeconds

  // Use Redis sorted set for sliding window
  const pipeline = redis.pipeline()

  // Remove old entries outside the window
  pipeline.zremrangebyscore(key, 0, windowStart)

  // Add current request
  pipeline.zadd(key, now, `${now}:${Math.random()}`)

  // Count requests in window
  pipeline.zcard(key)

  // Set expiry on the key
  pipeline.expire(key, config.windowSeconds)

  const results = await pipeline.exec()

  // Get the count from the zcard result
  const count = (results?.[2]?.[1] as number) || 0
  const resetTime = now + config.windowSeconds

  return {
    allowed: count <= config.maxRequests,
    current: count,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - count),
    resetTime,
  }
}

/**
 * Check rate limit using in-memory store (fallback)
 */
function checkRateLimitMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Math.floor(Date.now() / 1000)
  const entry = inMemoryStore.get(key)

  // Clean up if window has expired
  if (entry && entry.resetTime <= now) {
    inMemoryStore.delete(key)
  }

  const current = inMemoryStore.get(key)

  if (!current) {
    // First request in window
    const resetTime = now + config.windowSeconds
    inMemoryStore.set(key, { count: 1, resetTime })

    return {
      allowed: true,
      current: 1,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime,
    }
  }

  // Increment count
  current.count++
  inMemoryStore.set(key, current)

  return {
    allowed: current.count <= config.maxRequests,
    current: current.count,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - current.count),
    resetTime: current.resetTime,
  }
}

/**
 * Check rate limit for a request
 *
 * @param request - The incoming request
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RateLimitPresets.STANDARD
): Promise<RateLimitResult> {
  const clientId = getClientId(request)
  const key = `${config.keyPrefix || 'rl'}:${clientId}`

  const redisConnected = await isRedisConnected()

  if (redisConnected) {
    return checkRateLimitRedis(key, config)
  }

  return checkRateLimitMemory(key, config)
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetTime),
  }
}

/**
 * Create a rate-limited response (429 Too Many Requests)
 */
export function createRateLimitedResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.resetTime - Math.floor(Date.now() / 1000),
    },
    {
      status: 429,
      headers: {
        ...createRateLimitHeaders(result),
        'Retry-After': String(result.resetTime - Math.floor(Date.now() / 1000)),
      },
    }
  )
}

/**
 * Rate limit middleware wrapper
 *
 * Use this to wrap API handlers with rate limiting:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const rateLimitResult = await withRateLimit(request, RateLimitPresets.STANDARD)
 *   if (rateLimitResult) return rateLimitResult
 *
 *   // ... your handler logic
 * }
 * ```
 */
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RateLimitPresets.STANDARD
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, config)

  if (!result.allowed) {
    return createRateLimitedResponse(result)
  }

  return null
}

/**
 * Clean up expired entries from in-memory store
 * Called periodically to prevent memory leaks
 */
export function cleanupInMemoryStore(): void {
  const now = Math.floor(Date.now() / 1000)
  const keysToDelete: string[] = []

  inMemoryStore.forEach((value, key) => {
    if (value.resetTime <= now) {
      keysToDelete.push(key)
    }
  })

  keysToDelete.forEach((key) => inMemoryStore.delete(key))
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupInMemoryStore, 5 * 60 * 1000)
}
