import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindMany = vi.fn()
const mockCount = vi.fn()
const mockUpdate = vi.fn()
const mockFindUnique = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    event: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
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

describe('eventService.listPruefstand', () => {
  it('defaults to active edition and non-PUBLISHED statuses', async () => {
    await eventService.listPruefstand({})
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          editionId: 'active-edition-id',
          reviewStatus: { in: ['DRAFT_FROM_ROLLOVER', 'NEEDS_REVIEW'] },
        }),
      })
    )
  })

  it('filters by a specific reviewStatus when provided', async () => {
    await eventService.listPruefstand({ reviewStatus: 'DRAFT_FROM_ROLLOVER' })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ reviewStatus: 'DRAFT_FROM_ROLLOVER' }),
      })
    )
  })

  it('honors explicit editionId', async () => {
    await eventService.listPruefstand({ editionId: 'explicit' })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ editionId: 'explicit' }) })
    )
  })

  it('applies title search', async () => {
    await eventService.listPruefstand({ search: 'Physik' })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: { contains: 'Physik', mode: 'insensitive' },
        }),
      })
    )
  })

  it('includes relations needed by the table (melder, building, room, sourceEvent)', async () => {
    await eventService.listPruefstand({})
    const call = mockFindMany.mock.calls[0][0] as { include?: Record<string, unknown> }
    expect(call.include).toBeDefined()
    expect(call.include?.melder).toBeTruthy()
    expect(call.include?.building).toBeTruthy()
    expect(call.include?.room).toBeTruthy()
    expect(call.include?.sourceEvent).toBeTruthy()
  })
})

describe('eventService.countPruefstand', () => {
  it('counts DRAFT_FROM_ROLLOVER + NEEDS_REVIEW in active edition by default', async () => {
    mockCount.mockResolvedValue(5)
    const result = await eventService.countPruefstand()
    expect(result).toBe(5)
    expect(mockCount).toHaveBeenCalledWith({
      where: {
        editionId: 'active-edition-id',
        reviewStatus: { in: ['DRAFT_FROM_ROLLOVER', 'NEEDS_REVIEW'] },
      },
    })
  })

  it('honors explicit editionId', async () => {
    await eventService.countPruefstand({ editionId: 'explicit' })
    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ editionId: 'explicit' }) })
    )
  })
})

describe('eventService.publish', () => {
  it('flips non-PUBLISHED events to PUBLISHED', async () => {
    mockFindUnique.mockResolvedValue({ reviewStatus: 'DRAFT_FROM_ROLLOVER' })
    mockUpdate.mockResolvedValue({ id: 'ev1', reviewStatus: 'PUBLISHED' })
    const result = await eventService.publish('ev1')
    expect(result.reviewStatus).toBe('PUBLISHED')
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'ev1' },
      data: { reviewStatus: 'PUBLISHED' },
    })
  })

  it('throws when the event does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)
    await expect(eventService.publish('missing')).rejects.toThrow('Event not found')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('throws when already PUBLISHED', async () => {
    mockFindUnique.mockResolvedValue({ reviewStatus: 'PUBLISHED' })
    await expect(eventService.publish('ev1')).rejects.toThrow('bereits veröffentlicht')
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})