import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindMany = vi.fn()
vi.mock('@/lib/db/prisma', () => ({
  prisma: { building: { findMany: (...a: unknown[]) => mockFindMany(...a) } },
}))
vi.mock('@/lib/cache/redis', () => ({
  redis: {},
  isRedisConnected: vi.fn().mockResolvedValue(false),
}))

import { getAllBuildings } from '@/services/route-service'

const row = (over: Record<string, unknown>) => ({
  id: 'id',
  slug: 'slug',
  name: 'Gebäude',
  shortName: null,
  address: null,
  campus: null,
  latitude: null,
  longitude: null,
  hasAccessibility: false,
  accessibilityNotes: null,
  _count: { events: 0 },
  ...over,
})

beforeEach(() => vi.clearAllMocks())

describe('getAllBuildings', () => {
  it('returns null coordinates for buildings without a position and normalises the campus', async () => {
    mockFindMany.mockResolvedValue([
      row({ slug: 'a', campus: 'Innenstadt', latitude: 52.27, longitude: 8.04 }),
      row({ slug: 'b', campus: 'Caprivi', latitude: null, longitude: null }),
      row({ slug: 'c', campus: null, latitude: 52.28, longitude: null }),
    ])
    const all = await getAllBuildings()
    expect(all.map((b) => [b.id, b.campus, b.coordinates])).toEqual([
      ['a', 'schloss', { latitude: 52.27, longitude: 8.04 }],
      ['b', 'caprivi', null],
      ['c', 'other', null],
    ])
  })
})
