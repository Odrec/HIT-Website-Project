import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindMany = vi.fn()
const mockFindUnique = vi.fn()
const mockFindFirst = vi.fn()
const mockCount = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockDeleteMany = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    event: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    },
  },
}))

vi.mock('@/lib/active-edition', () => ({
  getActiveEditionId: vi.fn().mockResolvedValue('active-edition-id'),
  getActiveEdition: vi.fn(),
}))

import { eventService } from '@/services/event-service'

beforeEach(() => {
  vi.clearAllMocks()
  mockFindMany.mockResolvedValue([])
  mockCount.mockResolvedValue(0)
})

describe('eventService.list edition scoping', () => {
  it('defaults to active edition when no editionId passed', async () => {
    await eventService.list({})
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ editionId: 'active-edition-id' }),
      })
    )
  })

  it('honors explicit editionId string', async () => {
    await eventService.list({ editionId: 'specific-edition' })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ editionId: 'specific-edition' }),
      })
    )
  })

  it('omits filter entirely when editionId = null (admin cross-edition)', async () => {
    await eventService.list({ editionId: null })
    const call = mockFindMany.mock.calls[0][0] as { where: { editionId?: string } }
    expect(call.where.editionId).toBeUndefined()
  })
})

describe('eventService.getById edition scoping', () => {
  it('defaults to active edition', async () => {
    mockFindFirst.mockResolvedValue(null)
    await eventService.getById('event-1')
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'event-1', editionId: 'active-edition-id' },
      })
    )
  })

  it('honors editionId=null for admin cross-edition access', async () => {
    mockFindFirst.mockResolvedValue(null)
    await eventService.getById('event-1', { editionId: null })
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'event-1' } })
    )
  })

  it('honors explicit editionId string', async () => {
    mockFindFirst.mockResolvedValue(null)
    await eventService.getById('event-1', { editionId: 'specific' })
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'event-1', editionId: 'specific' },
      })
    )
  })
})

describe('eventService.create edition stamping', () => {
  it('always stamps active editionId via edition.connect', async () => {
    mockCreate.mockResolvedValue({ id: 'new' })
    await eventService.create({
      title: 'T',
      eventType: 'LECTURE',
      locationType: 'CONFIRMED',
      institution: 'UNI',
    } as never)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          edition: { connect: { id: 'active-edition-id' } },
        }),
      })
    )
  })
})

describe('eventService.duplicate edition stamping', () => {
  it('fetches source with editionId=null (cross-edition), stamps active editionId on clone', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'original',
      title: 'X',
      description: null,
      eventType: 'LECTURE',
      timeStart: null,
      timeEnd: null,
      locationType: 'CONFIRMED',
      locationDetails: null,
      locationMode: 'CONFIRMED',
      locationWishArea: null,
      roomRequest: null,
      meetingPoint: null,
      additionalInfo: null,
      photoUrl: null,
      institution: 'UNI',
      isCrossProgram: false,
      locationHint: null,
      melderId: null,
      buildingId: null,
      roomId: null,
      lecturers: [],
      organizers: [],
      studyPrograms: [],
      infoMarkets: [],
    })
    mockCreate.mockResolvedValue({ id: 'duplicate' })
    await eventService.duplicate('original')
    // getById for duplicate should use editionId: null (cross-edition)
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'original' } })
    )
    // create should stamp active edition
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          edition: { connect: { id: 'active-edition-id' } },
        }),
      })
    )
  })
})