import redis from './redis'
import { CacheTTL } from './cache-keys'

/**
 * Cache utility functions for get/set/invalidate operations
 */

/**
 * Get a value from cache
 * Returns null if key doesn't exist or on error
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key)
    if (!value) return null
    return JSON.parse(value) as T
  } catch (error) {
    console.error(`[Cache] Error getting key ${key}:`, error)
    return null
  }
}

/**
 * Set a value in cache with optional TTL
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = CacheTTL.MEDIUM
): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value)
    await redis.setex(key, ttlSeconds, serialized)
    return true
  } catch (error) {
    console.error(`[Cache] Error setting key ${key}:`, error)
    return false
  }
}

/**
 * Delete a specific key from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.error(`[Cache] Error deleting key ${key}:`, error)
    return false
  }
}

/**
 * Delete multiple keys matching a pattern
 * Use with caution - pattern matching can be slow on large datasets
 */
export async function cacheDeletePattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length === 0) return 0
    const count = await redis.del(...keys)
    return count
  } catch (error) {
    console.error(`[Cache] Error deleting pattern ${pattern}:`, error)
    return 0
  }
}

/**
 * Get or set - returns cached value or executes getter and caches result
 */
export async function cacheGetOrSet<T>(
  key: string,
  getter: () => Promise<T>,
  ttlSeconds: number = CacheTTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute getter and cache the result
  const value = await getter()
  await cacheSet(key, value, ttlSeconds)
  return value
}

/**
 * Check if a key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const exists = await redis.exists(key)
    return exists === 1
  } catch (error) {
    console.error(`[Cache] Error checking key ${key}:`, error)
    return false
  }
}

/**
 * Get the TTL (time to live) of a key in seconds
 * Returns -2 if key doesn't exist, -1 if key has no expiry
 */
export async function cacheGetTTL(key: string): Promise<number> {
  try {
    return await redis.ttl(key)
  } catch (error) {
    console.error(`[Cache] Error getting TTL for key ${key}:`, error)
    return -2
  }
}

/**
 * Invalidate all event-related caches
 * Call this after creating, updating, or deleting events
 */
export async function invalidateEventCaches(): Promise<void> {
  await cacheDeletePattern('hit:events:*')
}

/**
 * Invalidate all study program caches
 */
export async function invalidateProgramCaches(): Promise<void> {
  await cacheDeletePattern('hit:programs:*')
  await cacheDeletePattern('hit:clusters:*')
}

/**
 * Invalidate all location caches
 */
export async function invalidateLocationCaches(): Promise<void> {
  await cacheDeletePattern('hit:locations:*')
}

/**
 * Flush all HIT-related caches
 * Use sparingly - only for major data updates
 */
export async function flushAllCaches(): Promise<void> {
  await cacheDeletePattern('hit:*')
}
