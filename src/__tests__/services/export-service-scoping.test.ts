import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLecturerFindMany = vi.fn().mockResolvedValue([])
const mockMelderFindMany = vi.fn().mockResolvedValue([])
const mockEventInformationMarketFindMany = vi.fn().mockResolvedValue([])

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    lecturer: { findMany: (...args: unknown[]) => mockLecturerFindMany(...args) },
    melder: { findMany: (...args: unknown[]) => mockMelderFindMany(...args) },
    eventInformationMarket: {
      findMany: (...args: unknown[]) => mockEventInformationMarketFindMany(...args),
    },
    event: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    informationMarket: { findMany: vi.fn().mockResolvedValue([]) },
    building: { findMany: vi.fn().mockResolvedValue([]) },
    room: { findMany: vi.fn().mockResolvedValue([]) },
  },
}))

vi.mock('@/lib/active-edition', () => ({
  getActiveEditionId: vi.fn().mockResolvedValue('active-edition-id'),
  getActiveEdition: vi.fn().mockResolvedValue({
    id: 'active-edition-id',
    year: 2026,
    status: 'ACTIVE',
  }),
}))

import { exportService } from '@/services/export-service'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('export-service edition scoping (relation joins)', () => {
  it('lecturers() filters by active edition and published review-status via event relation', async () => {
    await exportService.lecturers()
    expect(mockLecturerFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          event: { editionId: 'active-edition-id', reviewStatus: 'PUBLISHED' },
        }),
      })
    )
  })

  it('melders() counts only active-edition published events', async () => {
    await exportService.melders()
    const call = mockMelderFindMany.mock.calls[0][0]
    expect(call._count).toBeUndefined()
    expect(call.include._count.select.events.where).toEqual({
      editionId: 'active-edition-id',
      reviewStatus: 'PUBLISHED',
    })
  })

  it('infomaerkte() filters junction rows by active edition and published review-status via event relation', async () => {
    await exportService.infomaerkte()
    expect(mockEventInformationMarketFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          event: { editionId: 'active-edition-id', reviewStatus: 'PUBLISHED' },
        }),
      })
    )
  })
})
