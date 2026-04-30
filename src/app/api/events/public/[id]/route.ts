// Public Event Detail API - GET endpoint for single event with related events

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getActiveEditionId } from '@/lib/active-edition'
import { cacheGet, cacheSet } from '@/lib/cache/cache-utils'
import { CacheKeys, CacheTTL } from '@/lib/cache/cache-keys'
import { isRedisConnected } from '@/lib/cache/redis'

const PUBLIC_CACHE_HEADER = 'public, s-maxage=60, stale-while-revalidate=120'

/**
 * GET /api/events/public/[id] - Get a single event with related events
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const editionIdOverride = searchParams.get('edition')
    const editionId = editionIdOverride ?? (await getActiveEditionId())

    // Cache key includes edition so a future cross-edition switch can't leak
    // a stale event detail across editions.
    const cacheKey = `${CacheKeys.events.byId(id)}:edition:${editionId}`
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

    // Fetch the event with all its relations
    const event = await prisma.event.findFirst({
      where: { id, editionId, reviewStatus: 'PUBLISHED' },
      include: {
        building: true,
        room: true,
        lecturers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            email: true,
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
        infoMarkets: {
          include: {
            market: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get related events based on study programs
    const studyProgramIds = event.studyPrograms.map((esp) => esp.studyProgramId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let relatedEvents: any[] = []

    if (studyProgramIds.length > 0) {
      relatedEvents = await prisma.event.findMany({
        where: {
          id: { not: event.id },
          studyPrograms: {
            some: {
              studyProgramId: { in: studyProgramIds },
            },
          },
          editionId,
          reviewStatus: 'PUBLISHED',
        },
        take: 6,
        orderBy: { timeStart: 'asc' },
        include: {
          building: true,
          room: true,
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
      })
    }

    // If not enough related events by study program, get events with same type
    if (relatedEvents.length < 3) {
      const additionalEvents = await prisma.event.findMany({
        where: {
          id: {
            not: event.id,
            notIn: relatedEvents.map((e) => e.id),
          },
          eventType: event.eventType,
          editionId,
          reviewStatus: 'PUBLISHED',
        },
        take: 3 - relatedEvents.length,
        orderBy: { timeStart: 'asc' },
        include: {
          building: true,
          room: true,
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
      })
      relatedEvents = [...relatedEvents, ...additionalEvents]
    }

    // Map institution from Prisma enum back to frontend value
    // Prisma enum uses: UNI, HOCHSCHULE, BOTH
    // Frontend uses: UNI, HS, BOTH
    const mapInstitutionToFrontend = (inst: string): string => {
      if (inst === 'HOCHSCHULE') return 'HS'
      return inst
    }

    // Transform the event response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformEvent = (e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      eventType: e.eventType,
      timeStart: e.timeStart?.toISOString(),
      timeEnd: e.timeEnd?.toISOString(),
      locationType: e.locationType,
      locationDetails: e.locationDetails,
      meetingPoint: e.meetingPoint,
      additionalInfo: e.additionalInfo,
      photoUrl: e.photoUrl,
      institution: mapInstitutionToFrontend(e.institution),
      building: e.building || null,
      room: e.room || null,
      lecturers: e.lecturers,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      studyPrograms: e.studyPrograms.map((esp: any) => esp.studyProgram),
      organizers: e.organizers,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      infoMarkets: e.infoMarkets?.map((eim: any) => eim.market) || [],
    })

    const responseData = {
      event: transformEvent(event),
      relatedEvents: relatedEvents.map(transformEvent),
    }

    if (redisConnected) {
      await cacheSet(cacheKey, responseData, CacheTTL.EVENTS)
    }

    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': PUBLIC_CACHE_HEADER,
      },
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}
