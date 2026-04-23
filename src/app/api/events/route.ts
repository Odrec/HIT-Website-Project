// Events API - GET (list) and POST (create) endpoints

import { NextRequest, NextResponse } from 'next/server'
import { eventService } from '@/services'
import { auth } from '@/auth'
import { EventType, Institution, LocationType } from '@/types/events'
import { sendEventCreatedEmail } from '@/lib/email'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/events - List events with filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const search = searchParams.get('search') || undefined
    const institution = searchParams.get('institution') as Institution | undefined
    const eventType = searchParams.get('eventType') as EventType | undefined
    const studyProgramId = searchParams.get('studyProgramId') || undefined
    const clusterId = searchParams.get('clusterId') || undefined
    const buildingId = searchParams.get('buildingId') || undefined
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const includeReview = searchParams.get('includeReview') === '1'

    // Parse sort options
    const sortField = (searchParams.get('sortField') || 'createdAt') as
      | 'title'
      | 'timeStart'
      | 'institution'
      | 'eventType'
      | 'createdAt'
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc'

    // Role-based filtering: ORGANIZERs only see their own events
    let melderId: string | null | undefined = undefined
    const session = await auth()
    if (session?.user?.role === 'ORGANIZER') {
      const melder = await prisma.melder.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (!melder) {
        // No Melder record — return empty result
        return NextResponse.json({ data: [], total: 0, page, pageSize, totalPages: 0 })
      }
      melderId = melder.id
    }

    const result = await eventService.list({
      page,
      pageSize,
      filters: {
        search,
        institution,
        eventType,
        studyProgramId,
        clusterId,
        buildingId,
        startDate,
        endDate,
        ...(melderId !== undefined ? { melderId } : {}),
        ...(includeReview ? {} : { reviewStatus: 'PUBLISHED' as const }),
      },
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

/**
 * POST /api/events - Create a new event (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'ORGANIZER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Deadline check for non-admin users
    if (session.user.role !== 'ADMIN') {
      const { isDeadlinePassed } = await import('@/services/edition-service')
      if (await isDeadlinePassed()) {
        return NextResponse.json(
          {
            error:
              'Anmeldefrist abgelaufen. Neue Veranstaltungen können nicht mehr eingereicht werden.',
          },
          { status: 403 }
        )
      }
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.eventType || !body.locationType || !body.institution) {
      return NextResponse.json(
        { error: 'Missing required fields: title, eventType, locationType, institution' },
        { status: 400 }
      )
    }

    // Validate enum values
    if (!Object.values(EventType).includes(body.eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${Object.values(EventType).join(', ')}` },
        { status: 400 }
      )
    }

    if (!Object.values(LocationType).includes(body.locationType)) {
      return NextResponse.json(
        {
          error: `Invalid locationType. Must be one of: ${Object.values(LocationType).join(', ')}`,
        },
        { status: 400 }
      )
    }

    if (!Object.values(Institution).includes(body.institution)) {
      return NextResponse.json(
        { error: `Invalid institution. Must be one of: ${Object.values(Institution).join(', ')}` },
        { status: 400 }
      )
    }

    // Parse dates if provided
    const eventData = {
      ...body,
      isCrossProgram: body.isCrossProgram ?? false,
      locationHint: body.locationHint || null,
      melderId: body.melderId || null,
      buildingId: body.buildingId || null,
      roomId: body.roomId || null,
      timeStart: body.timeStart ? new Date(body.timeStart) : undefined,
      timeEnd: body.timeEnd ? new Date(body.timeEnd) : undefined,
    }

    const event = await eventService.create(eventData)

    // Fire-and-forget email notification
    sendEventCreatedEmail(event as Parameters<typeof sendEventCreatedEmail>[0]).catch(() => {})

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
