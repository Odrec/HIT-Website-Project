import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { cacheGet, cacheSet } from '@/lib/cache/cache-utils'
import { CacheKeys, CacheTTL } from '@/lib/cache/cache-keys'
import { isRedisConnected } from '@/lib/cache/redis'

const PUBLIC_CACHE_HEADER = 'public, s-maxage=600, stale-while-revalidate=1800'

export async function GET() {
  try {
    const cacheKey = CacheKeys.clusters.all()
    const redisConnected = await isRedisConnected()

    if (redisConnected) {
      const cached = await cacheGet<unknown>(cacheKey)
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': PUBLIC_CACHE_HEADER,
          },
        })
      }
    }

    const clusters = await prisma.studyProgramCluster.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        institution: true,
      },
    })

    // BOTH-institution clusters surface in both sections so the admin selector's
    // "Universität & Hochschule" choice does something visible (a previous gap
    // silently dropped them).
    const responseData = {
      uni: clusters.filter((c) => c.institution === 'UNI' || c.institution === 'BOTH'),
      hochschule: clusters.filter(
        (c) => c.institution === 'HOCHSCHULE' || c.institution === 'BOTH'
      ),
    }

    if (redisConnected) {
      await cacheSet(cacheKey, responseData, CacheTTL.CLUSTERS)
    }

    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': PUBLIC_CACHE_HEADER,
      },
    })
  } catch (error) {
    console.error('Error fetching clusters:', error)
    return NextResponse.json({ error: 'Failed to fetch clusters' }, { status: 500 })
  }
}
