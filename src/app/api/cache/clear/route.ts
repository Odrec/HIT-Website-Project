// Cache Clear API - POST and GET endpoints

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import {
  flushAllCaches,
  invalidateEventCaches,
  invalidateProgramCaches,
  invalidateLocationCaches,
} from '@/lib/cache/cache-utils'
import { isRedisConnected } from '@/lib/cache/redis'

/**
 * GET /api/cache/clear - Get cache status (requires admin)
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const connected = await isRedisConnected()

    return NextResponse.json({
      redis: {
        connected,
        status: connected ? 'online' : 'offline',
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error checking cache status:', error)
    return NextResponse.json({ error: 'Failed to check cache status' }, { status: 500 })
  }
}

/**
 * POST /api/cache/clear - Clear the application cache (requires admin)
 *
 * Body options:
 * - { type: 'all' } - Clear all caches
 * - { type: 'events' } - Clear only event caches
 * - { type: 'programs' } - Clear only study program caches
 * - { type: 'locations' } - Clear only location caches
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    // Check if Redis is connected
    const connected = await isRedisConnected()
    if (!connected) {
      return NextResponse.json(
        {
          success: false,
          message: 'Redis is not connected. Cache operations are disabled.',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    // Parse request body for cache type
    let cacheType = 'all'
    try {
      const body = await request.json()
      if (body.type && ['all', 'events', 'programs', 'locations'].includes(body.type)) {
        cacheType = body.type
      }
    } catch {
      // No body provided, default to 'all'
    }

    // Clear the appropriate caches
    switch (cacheType) {
      case 'events':
        await invalidateEventCaches()
        break
      case 'programs':
        await invalidateProgramCaches()
        break
      case 'locations':
        await invalidateLocationCaches()
        break
      case 'all':
      default:
        await flushAllCaches()
        break
    }

    console.log(`[Cache] Cache clear (${cacheType}) requested by:`, session.user.email)

    return NextResponse.json({
      success: true,
      message: `Cache cleared successfully (type: ${cacheType})`,
      clearedType: cacheType,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 })
  }
}
