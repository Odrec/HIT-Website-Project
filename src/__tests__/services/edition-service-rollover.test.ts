import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockHitEditionCreate = vi.fn()
const mockHitEditionUpdate = vi.fn()
const mockHitEditionFindFirst = vi.fn()
const mockEventFindMany = vi.fn()
const mockEventCreate = vi.fn()
const mockMelderFindUnique = vi.fn()
const mockMelderFindMany = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    hitEdition: {
      create: (...args: unknown[]) => mockHitEditionCreate(...args),
      update: (...args: unknown[]) => mockHitEditionUpdate(...args),
      findFirst: (...args: unknown[]) => mockHitEditionFindFirst(...args),
    },
    event: {
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
      create: (...args: unknown[]) => mockEventCreate(...args),
    },
    melder: {
      findUnique: (...args: unknown[]) => mockMelderFindUnique(...args),
      findMany: (...args: unknown[]) => mockMelderFindMany(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn),
  },
}))

import { rollover } from '@/services/edition-service'

beforeEach(() => {
  vi.clearAllMocks()
  mockTransaction.mockImplementation(async (fn) => {
    const tx = {
      hitEdition: {
        create: mockHitEditionCreate,
        update: mockHitEditionUpdate,
        findFirst: mockHitEditionFindFirst,
      },
      event: { findMany: mockEventFindMany, create: mockEventCreate },
      melder: { findUnique: mockMelderFindUnique, findMany: mockMelderFindMany },
    }
    return fn(tx)
  })
  mockEventFindMany.mockResolvedValue([])
  mockHitEditionFindFirst.mockResolvedValue({ id: 'old-active', year: 2026, status: 'ACTIVE' })
  mockHitEditionCreate.mockResolvedValue({ id: 'new-edition', year: 2027, status: 'ACTIVE' })
  mockHitEditionUpdate.mockResolvedValue({ id: 'old-active', status: 'ARCHIVED' })
})

const baseInput = {
  year: 2027,
  hitDate: new Date('2027-11-18'),
  submissionDeadline: null as Date | null,
  cloneEvents: true,
}

describe('rollover — edition creation and archival', () => {
  it('creates new ACTIVE edition and archives previous ACTIVE in one transaction', async () => {
    await rollover(baseInput)
    expect(mockTransaction).toHaveBeenCalledOnce()
    expect(mockHitEditionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        year: 2027,
        hitDate: new Date('2027-11-18'),
        status: 'ACTIVE',
      }),
    })
    expect(mockHitEditionUpdate).toHaveBeenCalledWith({
      where: { id: 'old-active' },
      data: { status: 'ARCHIVED' },
    })
  })

  it('skips archival when no previous ACTIVE exists', async () => {
    mockHitEditionFindFirst.mockResolvedValue(null)
    await rollover(baseInput)
    expect(mockHitEditionCreate).toHaveBeenCalled()
    expect(mockHitEditionUpdate).not.toHaveBeenCalled()
    expect(mockEventFindMany).not.toHaveBeenCalled()
  })

  it('persists submissionDeadline when provided', async () => {
    await rollover({ ...baseInput, submissionDeadline: new Date('2027-10-01') })
    expect(mockHitEditionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        submissionDeadline: new Date('2027-10-01'),
      }),
    })
  })
})

describe('rollover — event cloning', () => {
  const sourceEvent = {
    id: 'src-1',
    title: 'Vorlesung Physik',
    description: 'desc',
    eventType: 'LECTURE',
    timeStart: new Date('2026-11-19T10:00:00Z'),
    timeEnd: new Date('2026-11-19T11:00:00Z'),
    locationType: 'CONFIRMED',
    locationDetails: null,
    locationMode: 'CONFIRMED',
    locationWishArea: null,
    roomRequest: null,
    meetingPoint: null,
    additionalInfo: null,
    photoUrl: 'https://example.com/pic.jpg',
    institution: 'UNI',
    isCrossProgram: false,
    locationHint: null,
    melderId: 'melder-1',
    buildingId: 'bld-1',
    roomId: 'room-1',
    editionId: 'old-active',
    reviewStatus: 'PUBLISHED',
    sourceEventId: null,
    lecturers: [
      {
        firstName: 'Ada',
        lastName: 'Lovelace',
        title: 'Prof.',
        email: 'a@uni.de',
        affiliation: 'UNI',
      },
    ],
    organizers: [{ email: 'o@uni.de', phone: null, internalOnly: true }],
    studyPrograms: [{ studyProgramId: 'sp-1' }],
    infoMarkets: [{ marketId: 'im-1' }],
  }

  it('creates one clone per source event with DRAFT_FROM_ROLLOVER and sourceEventId', async () => {
    mockEventFindMany.mockResolvedValue([sourceEvent])
    mockMelderFindUnique.mockResolvedValue({ id: 'melder-1' })
    mockMelderFindMany.mockResolvedValue([{ id: 'melder-1' }])
    await rollover(baseInput)
    expect(mockEventCreate).toHaveBeenCalledOnce()
    expect(mockEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Vorlesung Physik',
          reviewStatus: 'DRAFT_FROM_ROLLOVER',
          sourceEvent: { connect: { id: 'src-1' } },
          edition: { connect: { id: 'new-edition' } },
        }),
      })
    )
  })

  it('nulls timeStart/timeEnd on clones', async () => {
    mockEventFindMany.mockResolvedValue([sourceEvent])
    mockMelderFindUnique.mockResolvedValue({ id: 'melder-1' })
    mockMelderFindMany.mockResolvedValue([{ id: 'melder-1' }])
    await rollover(baseInput)
    const createCall = mockEventCreate.mock.calls[0][0] as {
      data: { timeStart: Date | null; timeEnd: Date | null }
    }
    expect(createCall.data.timeStart).toBeNull()
    expect(createCall.data.timeEnd).toBeNull()
  })

  it('preserves melderId when the Melder still exists', async () => {
    mockEventFindMany.mockResolvedValue([sourceEvent])
    mockMelderFindUnique.mockResolvedValue({ id: 'melder-1' })
    mockMelderFindMany.mockResolvedValue([{ id: 'melder-1' }])
    await rollover(baseInput)
    const createCall = mockEventCreate.mock.calls[0][0] as {
      data: { melder?: { connect: { id: string } } }
    }
    expect(createCall.data.melder).toEqual({ connect: { id: 'melder-1' } })
  })

  it('nulls melderId when the Melder no longer exists', async () => {
    mockEventFindMany.mockResolvedValue([sourceEvent])
    mockMelderFindUnique.mockResolvedValue(null)
    mockMelderFindMany.mockResolvedValue([])
    await rollover(baseInput)
    const createCall = mockEventCreate.mock.calls[0][0] as {
      data: { melder?: { connect: { id: string } } }
    }
    expect(createCall.data.melder).toBeUndefined()
  })

  it('deep-clones lecturers, organizers, studyPrograms, infoMarkets', async () => {
    mockEventFindMany.mockResolvedValue([sourceEvent])
    mockMelderFindUnique.mockResolvedValue({ id: 'melder-1' })
    mockMelderFindMany.mockResolvedValue([{ id: 'melder-1' }])
    await rollover(baseInput)
    const createCall = mockEventCreate.mock.calls[0][0] as {
      data: {
        lecturers: { create: unknown[] }
        organizers: { create: unknown[] }
        studyPrograms: { create: unknown[] }
        infoMarkets: { create: unknown[] }
      }
    }
    expect(createCall.data.lecturers.create).toHaveLength(1)
    expect(createCall.data.organizers.create).toHaveLength(1)
    expect(createCall.data.studyPrograms.create).toEqual([{ studyProgramId: 'sp-1' }])
    expect(createCall.data.infoMarkets.create).toEqual([{ marketId: 'im-1' }])
  })

  it('copies buildingId, roomId, photoUrl, institution as-is', async () => {
    mockEventFindMany.mockResolvedValue([sourceEvent])
    mockMelderFindUnique.mockResolvedValue({ id: 'melder-1' })
    mockMelderFindMany.mockResolvedValue([{ id: 'melder-1' }])
    await rollover(baseInput)
    const createCall = mockEventCreate.mock.calls[0][0] as {
      data: {
        building?: { connect: { id: string } }
        room?: { connect: { id: string } }
        photoUrl?: string
        institution?: string
      }
    }
    expect(createCall.data.building).toEqual({ connect: { id: 'bld-1' } })
    expect(createCall.data.room).toEqual({ connect: { id: 'room-1' } })
    expect(createCall.data.photoUrl).toBe('https://example.com/pic.jpg')
    expect(createCall.data.institution).toBe('UNI')
  })

  it('does not clone events when cloneEvents is false', async () => {
    mockEventFindMany.mockResolvedValue([sourceEvent])
    await rollover({ ...baseInput, cloneEvents: false })
    expect(mockEventCreate).not.toHaveBeenCalled()
    expect(mockEventFindMany).not.toHaveBeenCalled()
  })

  it('sourceEventId points to the immediate predecessor (not the lineage root)', async () => {
    // Source event is itself already a clone from 2025 (has sourceEventId = '2025-original')
    const alreadyClonedEvent = {
      ...sourceEvent,
      id: '2026-clone',
      sourceEventId: '2025-original',
    }
    mockEventFindMany.mockResolvedValue([alreadyClonedEvent])
    mockMelderFindUnique.mockResolvedValue({ id: 'melder-1' })
    mockMelderFindMany.mockResolvedValue([{ id: 'melder-1' }])
    await rollover(baseInput)
    const createCall = mockEventCreate.mock.calls[0][0] as {
      data: { sourceEvent?: { connect: { id: string } } }
    }
    // Clone should point to its immediate predecessor (2026-clone), not the root (2025-original)
    expect(createCall.data.sourceEvent).toEqual({ connect: { id: '2026-clone' } })
  })

  it('returns edition and clonedCount', async () => {
    mockEventFindMany.mockResolvedValue([sourceEvent, { ...sourceEvent, id: 'src-2' }])
    mockMelderFindUnique.mockResolvedValue({ id: 'melder-1' })
    mockMelderFindMany.mockResolvedValue([{ id: 'melder-1' }])
    const result = await rollover(baseInput)
    expect(result.edition.id).toBe('new-edition')
    expect(result.clonedCount).toBe(2)
  })
})

describe('rollover — input validation and errors', () => {
  it('throws when year already exists (DB unique violation surfaces)', async () => {
    mockHitEditionCreate.mockRejectedValue(
      Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
    )
    await expect(rollover(baseInput)).rejects.toThrow()
  })

  it('throws when transaction callback rejects (rollback path)', async () => {
    mockTransaction.mockImplementation(async () => {
      throw new Error('DB down')
    })
    await expect(rollover(baseInput)).rejects.toThrow('DB down')
  })
})
