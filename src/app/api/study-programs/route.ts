// Study Programs API - GET and POST endpoints

import { NextRequest, NextResponse } from 'next/server'
import { studyProgramService } from '@/services'
import { prisma } from '@/lib/db/prisma'
import { Institution } from '@/types/events'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { cacheGet, cacheSet, invalidateProgramCaches } from '@/lib/cache/cache-utils'
import { CacheKeys, CacheTTL } from '@/lib/cache/cache-keys'
import { isRedisConnected } from '@/lib/cache/redis'

/**
 * Generate a cache key for study programs
 */
function generateCacheKey(institution?: string, grouped?: boolean): string {
  const base = CacheKeys.studyPrograms.all()
  const parts = [base]
  if (institution) parts.push(`inst:${institution}`)
  if (grouped) parts.push('grouped')
  return parts.join(':')
}

/**
 * GET /api/study-programs - List all study programs
 * Results are cached in Redis for performance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const institution = searchParams.get('institution') as Institution | undefined
    const grouped = searchParams.get('grouped') === 'true'

    // Check cache first (if Redis is available)
    const cacheKey = generateCacheKey(institution || undefined, grouped)
    const redisConnected = await isRedisConnected()
    
    if (redisConnected) {
      const cached = await cacheGet<unknown>(cacheKey)
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey,
          }
        })
      }
    }

    let result: unknown

    if (grouped) {
      result = await studyProgramService.getGroupedByCluster(institution)
    } else {
      result = await studyProgramService.list(
        institution ? { institution } : undefined
      )
    }

    // Cache the result
    if (redisConnected) {
      await cacheSet(cacheKey, result, CacheTTL.PROGRAMS)
    }

    return NextResponse.json(result, {
      headers: {
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey,
      }
    })
  } catch (error) {
    console.error('Error fetching study programs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study programs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/study-programs - Create a new study program (requires admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    if (!body.institution || !['UNI', 'HOCHSCHULE', 'BOTH'].includes(body.institution)) {
      return NextResponse.json(
        { error: 'Invalid or missing institution' },
        { status: 400 }
      )
    }

    const program = await prisma.studyProgram.create({
      data: {
        name: body.name,
        institution: body.institution,
        clusterId: body.clusterId || null,
      },
      include: {
        cluster: true,
      },
    })

    // Invalidate study program caches
    await invalidateProgramCaches()

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error('Error creating study program:', error)
    return NextResponse.json(
      { error: 'Failed to create study program' },
      { status: 500 }
    )
  }
}
