import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindMany = vi.fn()
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    studyProgramCluster: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}))

vi.mock('@/lib/cache/cache-utils', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/cache/redis', () => ({
  isRedisConnected: vi.fn().mockResolvedValue(false),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

import { GET } from '@/app/api/clusters/route'

describe('GET /api/clusters institution buckets', () => {
  it('places UNI clusters in the uni bucket', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'u1', name: 'Uni Field', institution: 'UNI', sortOrder: 0 },
    ])
    const res = await GET()
    const body = await res.json()
    expect(body.uni).toHaveLength(1)
    expect(body.hochschule).toHaveLength(0)
  })

  it('places HOCHSCHULE clusters in the hochschule bucket', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'h1', name: 'HS Field', institution: 'HOCHSCHULE', sortOrder: 0 },
    ])
    const res = await GET()
    const body = await res.json()
    expect(body.uni).toHaveLength(0)
    expect(body.hochschule).toHaveLength(1)
  })

  it('places BOTH clusters in both buckets (regression: previously dropped)', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'b1', name: 'Zentrale Angebote', institution: 'BOTH', sortOrder: 0 },
    ])
    const res = await GET()
    const body = await res.json()
    expect(body.uni).toHaveLength(1)
    expect(body.hochschule).toHaveLength(1)
    expect(body.uni[0].id).toBe('b1')
    expect(body.hochschule[0].id).toBe('b1')
  })

  it('mixes UNI, HOCHSCHULE, and BOTH correctly', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'u1', name: 'Uni', institution: 'UNI', sortOrder: 0 },
      { id: 'h1', name: 'HS', institution: 'HOCHSCHULE', sortOrder: 0 },
      { id: 'b1', name: 'Beide', institution: 'BOTH', sortOrder: 0 },
    ])
    const res = await GET()
    const body = await res.json()
    expect(body.uni.map((c: { id: string }) => c.id).sort()).toEqual(['b1', 'u1'])
    expect(body.hochschule.map((c: { id: string }) => c.id).sort()).toEqual(['b1', 'h1'])
  })

  it('orders clusters by sortOrder ascending then name ascending', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'b1', name: 'Zentrale Angebote', institution: 'BOTH', sortOrder: 0 },
      { id: 'u2', name: 'Anglistik', institution: 'UNI', sortOrder: 5 },
      { id: 'u1', name: 'Mathematik', institution: 'UNI', sortOrder: 5 },
    ])
    const res = await GET()
    const body = await res.json()
    // Inside the uni bucket the order should be: Zentrale Angebote (0),
    // then Anglistik (5, alphabetical first), then Mathematik (5).
    expect(body.uni.map((c: { name: string }) => c.name)).toEqual([
      'Zentrale Angebote',
      'Anglistik',
      'Mathematik',
    ])
    expect(mockFindMany.mock.calls[0][0].orderBy).toEqual([{ sortOrder: 'asc' }, { name: 'asc' }])
  })
})
