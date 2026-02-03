// Public Events API - GET endpoint for public event browsing (no authentication required)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/events/public - List events for public browsing
 * Supports filtering, sorting, pagination, and full-text search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

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
    const where: any = {}

    // Institution filter
    if (institution) {
      if (institution === 'BOTH') {
        // Show events for both institutions
        where.institution = 'BOTH'
      } else {
        // Show events for the specific institution OR both
        where.OR = [
          { institution: institution as 'UNI' | 'HS' },
          { institution: 'BOTH' }
        ]
      }
    }

    // Event type filter
    if (eventType) {
      where.eventType = eventType as 'VORTRAG' | 'LABORFUEHRUNG' | 'RUNDGANG' | 'WORKSHOP' | 'LINK' | 'INFOSTAND'
    }

    // Study program filter
    if (studyProgramId) {
      where.studyPrograms = {
        some: {
          studyProgramId: studyProgramId
        }
      }
    }

    // Time filters (filter by time of day regardless of date)
    // These will be used for events on the HIT day
    if (timeFrom || timeTo) {
      // For now, we filter by the full datetime
      // In a real HIT scenario, we'd filter by time within the event day
      if (timeFrom) {
        // Construct a filter that matches events starting after this time
        // This is a simplified version - in production you'd use database functions
      }
      if (timeTo) {
        // Construct a filter that matches events ending before this time
      }
    }

    // Full-text search across title, description, and lecturer names
    if (search) {
      const searchTerms = search.trim().toLowerCase()
      where.OR = [
        { title: { contains: searchTerms, mode: 'insensitive' } },
        { description: { contains: searchTerms, mode: 'insensitive' } },
        {
          lecturers: {
            some: {
              OR: [
                { firstName: { contains: searchTerms, mode: 'insensitive' } },
                { lastName: { contains: searchTerms, mode: 'insensitive' } },
              ]
            }
          }
        }
      ]
    }

    // Build sort options
    type EventSortField = 'timeStart' | 'title' | 'eventType' | 'institution' | 'createdAt'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any = {}
    const validSortFields: EventSortField[] = ['timeStart', 'title', 'eventType', 'institution', 'createdAt']
    
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
          location: true,
          lecturers: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
            }
          },
          studyPrograms: {
            include: {
              studyProgram: {
                select: {
                  id: true,
                  name: true,
                  institution: true,
                }
              }
            }
          },
          organizers: {
            where: {
              internalOnly: false
            },
            select: {
              id: true,
              email: true,
              phone: true,
            }
          }
        }
      }),
      prisma.event.count({ where })
    ])

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
      institution: event.institution,
      location: event.location ? {
        id: event.location.id,
        buildingName: event.location.buildingName,
        roomNumber: event.location.roomNumber,
        address: event.location.address,
      } : null,
      lecturers: event.lecturers,
      studyPrograms: event.studyPrograms.map((esp) => esp.studyProgram),
      organizers: event.organizers,
    }))

    return NextResponse.json({
      events: transformedEvents,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching public events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
