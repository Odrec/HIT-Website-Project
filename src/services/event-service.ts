// Event Service - Business logic for event management

import { Prisma } from '@/generated/prisma/client/client'
import { getActiveEditionId } from '@/lib/active-edition'
import { prisma } from '@/lib/db/prisma'
import { invalidateEventCaches } from '@/lib/cache/cache-utils'
import type {
  CreateEventInput,
  UpdateEventInput,
  EventFilters,
  EventSortOptions,
} from '@/types/events'

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
  /** editionId scoping: undefined = active, string = that edition, null = cross-edition (admin only). */
  editionId?: string | null
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

    if (filters.buildingId) {
      where.buildingId = filters.buildingId
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
            clusters: { some: { id: filters.clusterId } },
          },
        },
      }
    }

    if (filters.isCrossProgram !== undefined) {
      where.isCrossProgram = filters.isCrossProgram
    }

    if (filters.melderId !== undefined) {
      where.melderId = filters.melderId
    }

    if (filters.reviewStatus) {
      where.reviewStatus = filters.reviewStatus
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
          lecturers: true,
          organizers: true,
          melder: true,
          building: true,
          room: { include: { building: true } },
          studyPrograms: {
            include: {
              studyProgram: {
                include: {
                  clusters: true,
                },
              },
            },
          },
          infoMarkets: {
            include: {
              market: true,
            },
          },
        }
      : undefined

    // Edition scoping: default to active unless caller explicitly passes an id or null.
    if (options.editionId !== null) {
      where.editionId = options.editionId ?? (await getActiveEditionId())
    }

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
   * List events that are awaiting admin review (Prüfstand queue).
   *
   * Defaults to the active edition and to the non-PUBLISHED statuses
   * (DRAFT_FROM_ROLLOVER + NEEDS_REVIEW). Callers can narrow to a single
   * status or filter by title search.
   */
  async listPruefstand(
    options: {
      editionId?: string
      reviewStatus?: 'DRAFT_FROM_ROLLOVER' | 'NEEDS_REVIEW'
      search?: string
    } = {}
  ) {
    const editionId = options.editionId ?? (await getActiveEditionId())
    const where: Prisma.EventWhereInput = {
      editionId,
      reviewStatus: options.reviewStatus ?? {
        in: ['DRAFT_FROM_ROLLOVER', 'NEEDS_REVIEW'],
      },
    }
    if (options.search) {
      where.title = { contains: options.search, mode: 'insensitive' }
    }
    return prisma.event.findMany({
      where,
      include: {
        melder: true,
        building: true,
        room: { include: { building: true } },
        sourceEvent: {
          select: { id: true, title: true, edition: { select: { year: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  },

  /**
   * Count events awaiting admin review in the given edition (default: active).
   */
  async countPruefstand(options: { editionId?: string } = {}) {
    const editionId = options.editionId ?? (await getActiveEditionId())
    return prisma.event.count({
      where: {
        editionId,
        reviewStatus: { in: ['DRAFT_FROM_ROLLOVER', 'NEEDS_REVIEW'] },
      },
    })
  },

  /**
   * Mark an event as PUBLISHED, removing it from the Prüfstand queue.
   */
  async publish(id: string) {
    const existing = await prisma.event.findUnique({
      where: { id },
      select: { reviewStatus: true },
    })
    if (!existing) throw new Error('Event not found')
    if (existing.reviewStatus === 'PUBLISHED') {
      throw new Error('Event ist bereits veröffentlicht')
    }
    const result = await prisma.event.update({
      where: { id },
      data: { reviewStatus: 'PUBLISHED' },
    })
    await invalidateEventCaches()
    return result
  },

  /**
   * Get a single event by ID.
   *
   * Uses findFirst (not findUnique) so we can compound id + editionId in the where clause.
   */
  async getById(id: string, options: { editionId?: string | null } = {}) {
    const where: { id: string; editionId?: string } = { id }
    if (options.editionId !== null) {
      where.editionId = options.editionId ?? (await getActiveEditionId())
    }
    return prisma.event.findFirst({
      where,
      include: {
        lecturers: true,
        organizers: true,
        melder: true,
        building: true,
        room: { include: { building: true } },
        studyPrograms: {
          include: {
            studyProgram: {
              include: {
                clusters: true,
              },
            },
          },
        },
        infoMarkets: {
          include: {
            market: true,
          },
        },
        sourceEvent: {
          select: {
            id: true,
            title: true,
            edition: { select: { year: true } },
          },
        },
      },
    })
  },

  /**
   * Create a new event in the currently ACTIVE edition.
   *
   * No editionId override is accepted — submitters cannot target past or
   * future editions. The rollover flow in PR B uses a separate write path
   * that stamps a different edition.
   */
  async create(input: CreateEventInput) {
    const activeEditionId = await getActiveEditionId()
    const {
      lecturers = [],
      organizers = [],
      studyProgramIds = [],
      infoMarketIds = [],
      locationDetails,
      locationWishArea,
      melderId,
      buildingId,
      roomId,
      ...eventData
    } = input

    const result = await prisma.event.create({
      data: {
        ...eventData,
        edition: { connect: { id: activeEditionId } },
        isCrossProgram: input.isCrossProgram ?? false,
        locationHint: input.locationHint || null,
        locationWishArea: locationWishArea || null,
        ...(locationDetails !== undefined && {
          locationDetails: locationDetails as Prisma.InputJsonValue,
        }),
        ...(melderId && { melder: { connect: { id: melderId } } }),
        ...(buildingId && { building: { connect: { id: buildingId } } }),
        ...(roomId && { room: { connect: { id: roomId } } }),
        lecturers: {
          create: lecturers.map((lecturer) => ({
            firstName: lecturer.firstName,
            lastName: lecturer.lastName,
            title: lecturer.title,
            email: lecturer.email,
            affiliation: lecturer.affiliation,
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
        lecturers: true,
        organizers: true,
        melder: true,
        building: true,
        room: { include: { building: true } },
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
    await invalidateEventCaches()
    return result
  },

  /**
   * Update an existing event.
   *
   * Operates on primary key only — no edition scoping. Callers must ensure
   * the `id` comes from a trusted edition-filtered source (e.g. eventService.list
   * or getById), otherwise an admin with a stale cross-edition id could
   * accidentally mutate a different year's event. See spec §2.
   */
  async update(input: UpdateEventInput) {
    const {
      id,
      lecturers,
      organizers,
      studyProgramIds,
      infoMarketIds,
      melderId,
      buildingId,
      roomId,
      locationWishArea,
      ...eventData
    } = input

    // Build the update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      ...eventData,
      isCrossProgram: input.isCrossProgram ?? false,
      locationHint: input.locationHint || null,
      // Only touch melderId if a concrete value was provided. An empty string from
      // the form means "no live value to write" — preserve the existing relation
      // rather than nulling it. To intentionally clear, callers must pass `null`.
      ...(typeof melderId === 'string' && melderId.length > 0 && { melderId }),
      ...(melderId === null && { melderId: null }),
      ...(buildingId !== undefined && { buildingId: buildingId || null }),
      ...(roomId !== undefined && { roomId: roomId || null }),
      ...(locationWishArea !== undefined && { locationWishArea: locationWishArea || null }),
    }

    // Handle lecturers update (delete and recreate)
    if (lecturers !== undefined) {
      updateData.lecturers = {
        deleteMany: {},
        create: lecturers.map((lecturer) => ({
          firstName: lecturer.firstName,
          lastName: lecturer.lastName,
          title: lecturer.title,
          email: lecturer.email,
          affiliation: lecturer.affiliation,
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

    const result = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        lecturers: true,
        organizers: true,
        melder: true,
        building: true,
        room: { include: { building: true } },
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
    await invalidateEventCaches()
    return result
  },

  /**
   * Delete an event by id.
   *
   * Operates on primary key only — no edition scoping. See `update` for caveats.
   */
  async delete(id: string) {
    const result = await prisma.event.delete({
      where: { id },
    })
    await invalidateEventCaches()
    return result
  },

  /**
   * Delete multiple events by id.
   *
   * Operates on primary keys only — no edition scoping. Admin routes that
   * expose this MUST have already filtered the id list to the intended
   * edition, or stale cross-edition ids could be silently removed. See spec §2.
   */
  async deleteMany(ids: string[]) {
    const result = await prisma.event.deleteMany({
      where: {
        id: { in: ids },
      },
    })
    await invalidateEventCaches()
    return result
  },

  /**
   * Duplicate an event into the active edition.
   *
   * Fetches the source event cross-edition (admin-only operation — the caller
   * is trusted to pick a legitimate source). The clone always lands in the
   * active edition regardless of the source's edition.
   */
  async duplicate(id: string) {
    const original = await this.getById(id, { editionId: null })
    if (!original) {
      throw new Error('Event not found')
    }
    const activeEditionId = await getActiveEditionId()

    const result = await prisma.event.create({
      data: {
        title: `${original.title} (Copy)`,
        description: original.description,
        eventType: original.eventType,
        timeStart: original.timeStart,
        timeEnd: original.timeEnd,
        locationDetails: original.locationDetails ?? undefined,
        locationMode: original.locationMode,
        locationWishArea: original.locationWishArea,
        roomRequest: original.roomRequest,
        meetingPoint: original.meetingPoint,
        additionalInfo: original.additionalInfo,
        photoUrl: original.photoUrl,
        institution: original.institution,
        isCrossProgram: original.isCrossProgram,
        locationHint: original.locationHint,
        edition: { connect: { id: activeEditionId } },
        ...(original.melderId && { melder: { connect: { id: original.melderId } } }),
        ...(original.buildingId && { building: { connect: { id: original.buildingId } } }),
        ...(original.roomId && { room: { connect: { id: original.roomId } } }),
        lecturers: {
          create: original.lecturers.map((lecturer) => ({
            firstName: lecturer.firstName,
            lastName: lecturer.lastName,
            title: lecturer.title,
            email: lecturer.email,
            affiliation: lecturer.affiliation,
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
        lecturers: true,
        organizers: true,
        melder: true,
        building: true,
        room: { include: { building: true } },
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
    await invalidateEventCaches()
    return result
  },
}

export default eventService
