// Public Event Detail API - GET endpoint for single event with related events

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getActiveEditionId } from '@/lib/active-edition'

/**
 * GET /api/events/public/[id] - Get a single event with related events
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const editionId = await getActiveEditionId()

    // Fetch the event with all its relations
    const event = await prisma.event.findFirst({
      where: { id, editionId },
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

    return NextResponse.json({
      event: transformEvent(event),
      relatedEvents: relatedEvents.map(transformEvent),
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}
