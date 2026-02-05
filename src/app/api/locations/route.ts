// Locations API - GET and POST endpoints

import { NextRequest, NextResponse } from 'next/server'
import { locationService } from '@/services'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { cacheGet, cacheSet, invalidateLocationCaches } from '@/lib/cache/cache-utils'
import { CacheKeys, CacheTTL } from '@/lib/cache/cache-keys'
import { isRedisConnected } from '@/lib/cache/redis'

/**
 * GET /api/locations - List all locations
 * Results are cached in Redis for performance (locations rarely change)
 */
export async function GET() {
  try {
    const cacheKey = CacheKeys.locations.all()
    const redisConnected = await isRedisConnected()

    // Check cache first
    if (redisConnected) {
      const cached = await cacheGet<unknown[]>(cacheKey)
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey,
          },
        })
      }
    }

    const locations = await locationService.list()

    // Cache the result (longer TTL since locations rarely change)
    if (redisConnected) {
      await cacheSet(cacheKey, locations, CacheTTL.LOCATIONS)
    }

    return NextResponse.json(locations, {
      headers: {
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey,
      },
    })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}

/**
 * POST /api/locations - Create a new location (requires admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.buildingName) {
      return NextResponse.json({ error: 'Missing required field: buildingName' }, { status: 400 })
    }

    const location = await locationService.create({
      buildingName: body.buildingName,
      roomNumber: body.roomNumber,
      address: body.address,
      latitude: body.latitude ? parseFloat(body.latitude) : undefined,
      longitude: body.longitude ? parseFloat(body.longitude) : undefined,
    })

    // Invalidate location caches
    await invalidateLocationCaches()

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
  }
}
