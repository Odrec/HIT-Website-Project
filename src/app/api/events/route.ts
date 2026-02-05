// Events API - GET (list) and POST (create) endpoints

import { NextRequest, NextResponse } from 'next/server'
import { eventService } from '@/services'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { EventType, Institution, LocationType } from '@/types/events'

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
    const locationId = searchParams.get('locationId') || undefined
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    // Parse sort options
    const sortField = (searchParams.get('sortField') || 'createdAt') as
      | 'title'
      | 'timeStart'
      | 'institution'
      | 'eventType'
      | 'createdAt'
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc'

    const result = await eventService.list({
      page,
      pageSize,
      filters: {
        search,
        institution,
        eventType,
        studyProgramId,
        clusterId,
        locationId,
        startDate,
        endDate,
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
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'ORGANIZER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    // Convert 'none' locationId to null (placeholder value from form)
    const locationId = body.locationId === 'none' || body.locationId === '' ? null : body.locationId

    const eventData = {
      ...body,
      locationId,
      timeStart: body.timeStart ? new Date(body.timeStart) : undefined,
      timeEnd: body.timeEnd ? new Date(body.timeEnd) : undefined,
    }

    const event = await eventService.create(eventData)

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
