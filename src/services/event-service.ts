// Event Service - Business logic for event management

import { prisma } from '@/lib/db/prisma'
import type { CreateEventInput, UpdateEventInput, EventFilters, EventSortOptions } from '@/types/events'

// Default pagination settings
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ListEventsOptions {
  filters?: EventFilters
  sort?: EventSortOptions
  page?: number
  pageSize?: number
  includeRelations?: boolean
}

/**
 * Event service for CRUD operations and queries
 */
export const eventService = {
  /**
   * List events with filtering, sorting, and pagination
   */
  async list(options: ListEventsOptions = {}) {
    const {
      filters = {},
      sort = { field: 'createdAt', direction: 'desc' },
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      includeRelations = true,
    } = options

    const take = Math.min(pageSize, MAX_PAGE_SIZE)
    const skip = (page - 1) * take

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (filters.institution) {
      where.institution = filters.institution
    }

    if (filters.eventType) {
      where.eventType = filters.eventType
    }

    if (filters.locationId) {
      where.locationId = filters.locationId
    }

    if (filters.startDate || filters.endDate) {
      where.timeStart = {}
      if (filters.startDate) {
        where.timeStart.gte = filters.startDate
      }
      if (filters.endDate) {
        where.timeStart.lte = filters.endDate
      }
    }

    if (filters.studyProgramId) {
      where.studyPrograms = {
        some: {
          studyProgramId: filters.studyProgramId,
        },
      }
    }

    if (filters.clusterId) {
      where.studyPrograms = {
        some: {
          studyProgram: {
            clusterId: filters.clusterId,
          },
        },
      }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { meetingPoint: { contains: filters.search, mode: 'insensitive' } },
        {
          lecturers: {
            some: {
              OR: [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ]
    }

    // Build orderBy clause
    const orderBy = {
      [sort.field]: sort.direction,
    }

    // Include relations
    const include = includeRelations
      ? {
          location: true,
          lecturers: true,
          organizers: true,
          studyPrograms: {
            include: {
              studyProgram: true,
            },
          },
          infoMarkets: {
            include: {
              market: true,
            },
          },
        }
      : undefined

    // Execute queries in parallel
    const [data, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take,
        include,
      }),
      prisma.event.count({ where }),
    ])

    return {
      data,
      total,
      page,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    }
  },

  /**
   * Get a single event by ID
   */
  async getById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        location: true,
        lecturers: true,
        organizers: true,
        studyPrograms: {
          include: {
            studyProgram: {
              include: {
                cluster: true,
              },
            },
          },
        },
        infoMarkets: {
          include: {
            market: true,
          },
        },
      },
    })
  },

  /**
   * Create a new event
   */
  async create(input: CreateEventInput) {
    const {
      lecturers = [],
      organizers = [],
      studyProgramIds = [],
      infoMarketIds = [],
      ...eventData
    } = input

    return prisma.event.create({
      data: {
        ...eventData,
        lecturers: {
          create: lecturers.map((lecturer) => ({
            firstName: lecturer.firstName,
            lastName: lecturer.lastName,
            title: lecturer.title,
            email: lecturer.email,
            building: lecturer.building,
            roomNumber: lecturer.roomNumber,
          })),
        },
        organizers: {
          create: organizers.map((organizer) => ({
            email: organizer.email,
            phone: organizer.phone,
            internalOnly: organizer.internalOnly ?? true,
          })),
        },
        studyPrograms: {
          create: studyProgramIds.map((studyProgramId) => ({
            studyProgramId,
          })),
        },
        infoMarkets: {
          create: infoMarketIds.map((marketId) => ({
            marketId,
          })),
        },
      },
      include: {
        location: true,
        lecturers: true,
        organizers: true,
        studyPrograms: {
          include: {
            studyProgram: true,
          },
        },
        infoMarkets: {
          include: {
            market: true,
          },
        },
      },
    })
  },

  /**
   * Update an existing event
   */
  async update(input: UpdateEventInput) {
    const {
      id,
      lecturers,
      organizers,
      studyProgramIds,
      infoMarketIds,
      ...eventData
    } = input

    // Build the update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...eventData }

    // Handle lecturers update (delete and recreate)
    if (lecturers !== undefined) {
      updateData.lecturers = {
        deleteMany: {},
        create: lecturers.map((lecturer) => ({
          firstName: lecturer.firstName,
          lastName: lecturer.lastName,
          title: lecturer.title,
          email: lecturer.email,
          building: lecturer.building,
          roomNumber: lecturer.roomNumber,
        })),
      }
    }

    // Handle organizers update (delete and recreate)
    if (organizers !== undefined) {
      updateData.organizers = {
        deleteMany: {},
        create: organizers.map((organizer) => ({
          email: organizer.email,
          phone: organizer.phone,
          internalOnly: organizer.internalOnly ?? true,
        })),
      }
    }

    // Handle study programs update (delete and recreate)
    if (studyProgramIds !== undefined) {
      updateData.studyPrograms = {
        deleteMany: {},
        create: studyProgramIds.map((studyProgramId) => ({
          studyProgramId,
        })),
      }
    }

    // Handle info markets update (delete and recreate)
    if (infoMarketIds !== undefined) {
      updateData.infoMarkets = {
        deleteMany: {},
        create: infoMarketIds.map((marketId) => ({
          marketId,
        })),
      }
    }

    return prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        location: true,
        lecturers: true,
        organizers: true,
        studyPrograms: {
          include: {
            studyProgram: true,
          },
        },
        infoMarkets: {
          include: {
            market: true,
          },
        },
      },
    })
  },

  /**
   * Delete an event
   */
  async delete(id: string) {
    return prisma.event.delete({
      where: { id },
    })
  },

  /**
   * Delete multiple events
   */
  async deleteMany(ids: string[]) {
    return prisma.event.deleteMany({
      where: {
        id: { in: ids },
      },
    })
  },

  /**
   * Duplicate an event
   */
  async duplicate(id: string) {
    const original = await this.getById(id)
    if (!original) {
      throw new Error('Event not found')
    }

    return prisma.event.create({
      data: {
        title: `${original.title} (Copy)`,
        description: original.description,
        eventType: original.eventType,
        timeStart: original.timeStart,
        timeEnd: original.timeEnd,
        locationType: original.locationType,
        locationDetails: original.locationDetails ?? undefined,
        roomRequest: original.roomRequest,
        meetingPoint: original.meetingPoint,
        additionalInfo: original.additionalInfo,
        photoUrl: original.photoUrl,
        institution: original.institution,
        locationId: original.locationId,
        lecturers: {
          create: original.lecturers.map((lecturer) => ({
            firstName: lecturer.firstName,
            lastName: lecturer.lastName,
            title: lecturer.title,
            email: lecturer.email,
            building: lecturer.building,
            roomNumber: lecturer.roomNumber,
          })),
        },
        organizers: {
          create: original.organizers.map((organizer) => ({
            email: organizer.email,
            phone: organizer.phone,
            internalOnly: organizer.internalOnly,
          })),
        },
        studyPrograms: {
          create: original.studyPrograms.map((sp) => ({
            studyProgramId: sp.studyProgramId,
          })),
        },
        infoMarkets: {
          create: original.infoMarkets.map((im) => ({
            marketId: im.marketId,
          })),
        },
      },
      include: {
        location: true,
        lecturers: true,
        organizers: true,
        studyPrograms: {
          include: {
            studyProgram: true,
          },
        },
        infoMarkets: {
          include: {
            market: true,
          },
        },
      },
    })
  },
}

export default eventService
