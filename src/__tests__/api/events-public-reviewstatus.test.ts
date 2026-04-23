import { describe, it, expect, vi, beforeEach } from 'vitest'

// Inline mocks for prisma, active-edition, and cache utilities must be declared
// before importing the route module (vi.mock is hoisted).

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/active-edition', () => ({
  getActiveEdition: vi.fn().mockResolvedValue({
    id: 'active-edition-id',
    year: 2026,
    hitDate: new Date('2026-11-19'),
    status: 'ACTIVE',
  }),
  getActiveEditionId: vi.fn().mockResolvedValue('active-edition-id'),
}))

vi.mock('@/lib/cache/cache-utils', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/cache/redis', () => ({
  isRedisConnected: vi.fn().mockResolvedValue(false),
  default: {
    get: vi.fn(),
    setex: vi.fn(),
  },
}))

import { GET } from '@/app/api/events/public/route'
import { prisma } from '@/lib/db/prisma'

const mockFindMany = vi.mocked(prisma.event.findMany)
const mockCount = vi.mocked(prisma.event.count)

beforeEach(() => {
  vi.clearAllMocks()
  mockFindMany.mockResolvedValue([] as never)
  mockCount.mockResolvedValue(0 as never)
})

describe('GET /api/events/public reviewStatus filter', () => {
  it('scopes public events to reviewStatus=PUBLISHED', async () => {
    await GET(new Request('http://test/api/events/public') as never)

    expect(mockFindMany).toHaveBeenCalledTimes(1)
    const whereArg = mockFindMany.mock.calls[0][0] as { where: { AND?: unknown[] } }
    const whereAnd = (whereArg?.where?.AND ?? []) as Array<Record<string, unknown>>

    const hasReviewStatusPublished = whereAnd.some(
      (clause) =>
        typeof clause === 'object' &&
        clause !== null &&
        'reviewStatus' in clause &&
        (clause as { reviewStatus?: string }).reviewStatus === 'PUBLISHED'
    )
    expect(hasReviewStatusPublished).toBe(true)

    const hasEditionId = whereAnd.some(
      (clause) =>
        typeof clause === 'object' &&
        clause !== null &&
        'editionId' in clause &&
        (clause as { editionId?: string }).editionId === 'active-edition-id'
    )
    expect(hasEditionId).toBe(true)
  })
})
