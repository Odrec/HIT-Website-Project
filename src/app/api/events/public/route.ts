// Public Events API - GET endpoint for public event browsing (no authentication required)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { cacheGet, cacheSet } from '@/lib/cache/cache-utils'
import { CacheKeys, CacheTTL } from '@/lib/cache/cache-keys'
import { isRedisConnected } from '@/lib/cache/redis'
import { getActiveEdition } from '@/lib/active-edition'

/**
 * Generate a cache key from query parameters
 */
function generateCacheKey(searchParams: URLSearchParams): string {
  // Sort params for consistent keys
  const params = Array.from(searchParams.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  return `${CacheKeys.events.all()}:query:${params || 'default'}`
}

/**
 * GET /api/events/public - List events for public browsing
 * Supports filtering, sorting, pagination, and full-text search
 * Results are cached in Redis for performance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Resolve the active edition once so it can scope both the cache key
    // and the where-clause filter below.
    const edition = await getActiveEdition()

    // Check cache first (if Redis is available)
    const cacheKey = `${generateCacheKey(searchParams)}:edition:${edition.id}`
    const redisConnected = await isRedisConnected()

    if (redisConnected) {
      const cached = await cacheGet<{
        events: unknown[]
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>(cacheKey)

      if (cached) {
        // Return cached result with cache header
        return NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey,
          },
        })
      }
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '12', 10), 50)
    const search = searchParams.get('search') || undefined
    const institution = searchParams.get('institution') || undefined
    const eventType = searchParams.get('eventType') || undefined
    const studyProgramId = searchParams.get('studyProgramId') || undefined
    const timeFrom = searchParams.get('timeFrom') || undefined
    const timeTo = searchParams.get('timeTo') || undefined

    // Sort options
    const sortBy = searchParams.get('sortBy') || 'timeStart'
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc'

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { AND: [] }

    // Map institution from frontend value to Prisma enum value
    // Frontend uses: UNI, HS, BOTH
    // Prisma enum uses: UNI, HOCHSCHULE, BOTH
    const mapInstitution = (inst: string): string => {
      if (inst === 'HS') return 'HOCHSCHULE'
      return inst
    }

    // Institution filter
    if (institution) {
      if (institution === 'BOTH') {
        where.AND.push({ institution: 'BOTH' })
      } else {
        const mappedInstitution = mapInstitution(institution)
        where.AND.push({
          OR: [{ institution: mappedInstitution }, { institution: 'BOTH' }],
        })
      }
    }

    // Event type filter
    if (eventType) {
      where.AND.push({
        eventType: eventType as
          | 'VORTRAG'
          | 'LABORFUEHRUNG'
          | 'RUNDGANG'
          | 'WORKSHOP'
          | 'ONLINE'
          | 'VIDEO'
          | 'INFOSTAND',
      })
    }

    // isCrossProgram filter
    const isCrossProgram = searchParams.get('isCrossProgram')
    if (isCrossProgram === 'true') {
      where.AND.push({ isCrossProgram: true })
    }

    // Study program filter
    if (studyProgramId) {
      where.AND.push({
        studyPrograms: {
          some: {
            studyProgramId: studyProgramId,
          },
        },
      })
    }

    // Cluster filter
    const clusterId = searchParams.get('clusterId')
    if (clusterId) {
      where.AND.push({
        studyPrograms: {
          some: {
            studyProgram: {
              clusters: {
                some: { id: clusterId },
              },
            },
          },
        },
      })
    }

    // Lehramt combined filter — union of UNI "Lehramt" and HS "Lehramt an berufsbildenden Schulen"
    const lehramtCombined = searchParams.get('lehramtCombined')
    if (lehramtCombined === 'true') {
      const lehramtClusters = await prisma.studyProgramCluster.findMany({
        where: {
          OR: [
            { institution: 'UNI', name: 'Lehramt' },
            { institution: 'HOCHSCHULE', name: 'Lehramt an berufsbildenden Schulen' },
          ],
        },
        select: { id: true },
      })
      const lehramtIds = lehramtClusters.map((c) => c.id)
      where.AND.push({
        studyPrograms: {
          some: {
            studyProgram: {
              clusters: {
                some: { id: { in: lehramtIds } },
              },
            },
          },
        },
      })
    }

    // Time filters - filter by time of day on the HIT date
    // Frontend sends time strings like "09:00", "14:30"
    // We construct full datetimes using the HIT date from the active edition
    // (edition already resolved at the top of the handler for the cache key).
    const HIT_DATE = edition.hitDate.toISOString().slice(0, 10)
    // Scope every event query to the active edition so cross-tenant rows never leak.
    where.AND.push({ editionId: edition.id })
    // Only surface published events publicly — DRAFT_FROM_ROLLOVER clones and
    // other Prüfstand entries must stay hidden until editors finalize them.
    where.AND.push({ reviewStatus: 'PUBLISHED' })
    if (timeFrom) {
      const fromDateTime = new Date(`${HIT_DATE}T${timeFrom}:00`)
      if (!isNaN(fromDateTime.getTime())) {
        where.AND.push({ timeStart: { gte: fromDateTime } })
      }
    }
    if (timeTo) {
      const toDateTime = new Date(`${HIT_DATE}T${timeTo}:00`)
      if (!isNaN(toDateTime.getTime())) {
        where.AND.push({ timeStart: { lte: toDateTime } })
      }
    }

    // Full-text search across title, description, lecturer names, and study program names
    if (search) {
      const searchTerms = search.trim().toLowerCase()
      where.AND.push({
        OR: [
          { title: { contains: searchTerms, mode: 'insensitive' } },
          { description: { contains: searchTerms, mode: 'insensitive' } },
          {
            lecturers: {
              some: {
                OR: [
                  { firstName: { contains: searchTerms, mode: 'insensitive' } },
                  { lastName: { contains: searchTerms, mode: 'insensitive' } },
                ],
              },
            },
          },
          {
            studyPrograms: {
              some: {
                studyProgram: {
                  name: { contains: searchTerms, mode: 'insensitive' },
                },
              },
            },
          },
        ],
      })
    }

    // Remove empty AND array to avoid Prisma issues
    if (where.AND.length === 0) {
      delete where.AND
    }

    // Build sort options
    type EventSortField = 'timeStart' | 'title' | 'eventType' | 'institution' | 'createdAt'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any = {}
    const validSortFields: EventSortField[] = [
      'timeStart',
      'title',
      'eventType',
      'institution',
      'createdAt',
    ]

    if (validSortFields.includes(sortBy as EventSortField)) {
      orderBy[sortBy as EventSortField] = sortOrder
    } else {
      orderBy.timeStart = 'asc'
    }

    // Execute query with pagination
    const skip = (page - 1) * pageSize

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          melder: true,
          building: true,
          room: { include: { building: true } },
          lecturers: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
            },
          },
          studyPrograms: {
            include: {
              studyProgram: {
                select: {
                  id: true,
                  name: true,
                  institution: true,
                  url: true,
                  clusters: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          organizers: {
            where: {
              internalOnly: false,
            },
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ])

    // Map institution from Prisma enum back to frontend value
    // Prisma enum uses: UNI, HOCHSCHULE, BOTH
    // Frontend uses: UNI, HS, BOTH
    const mapInstitutionToFrontend = (inst: string): string => {
      if (inst === 'HOCHSCHULE') return 'HS'
      return inst
    }

    // Transform the response to flatten nested structures
    const transformedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      timeStart: event.timeStart?.toISOString(),
      timeEnd: event.timeEnd?.toISOString(),
      locationType: event.locationType,
      locationDetails: event.locationDetails,
      meetingPoint: event.meetingPoint,
      additionalInfo: event.additionalInfo,
      photoUrl: event.photoUrl,
      institution: mapInstitutionToFrontend(event.institution),
      isCrossProgram: event.isCrossProgram,
      locationHint: event.locationHint,
      melder: event.melder,
      building: event.building,
      room: event.room,
      lecturers: event.lecturers,
      studyPrograms: event.studyPrograms.map((esp) => esp.studyProgram),
      organizers: event.organizers,
    }))

    // Prepare response data
    const responseData = {
      events: transformedEvents,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }

    // Cache the result for future requests (if Redis is available)
    if (redisConnected) {
      // Use shorter TTL for search queries, longer for standard queries
      const ttl = search ? CacheTTL.SHORT : CacheTTL.EVENTS
      await cacheSet(cacheKey, responseData, ttl)
    }

    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey,
      },
    })
  } catch (error) {
    console.error('Error fetching public events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
