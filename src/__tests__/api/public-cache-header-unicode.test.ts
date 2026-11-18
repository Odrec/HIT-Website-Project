import { describe, it, expect, vi, beforeEach } from 'vitest'

// Query values end up in the Redis cache key. They must not end up in a
// response header: HTTP headers only carry characters up to U+00FF, so a
// search for „Lehramt" (German quotes, as phone keyboards type them), a dash
// or an emoji used to answer 500 instead of the results.

const mockCacheGet = vi.fn()
const mockIsRedisConnected = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    event: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
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
  cacheGet: (...args: unknown[]) => mockCacheGet(...args),
  cacheSet: vi.fn().mockResolvedValue(true),
  invalidateProgramCaches: vi.fn(),
}))

vi.mock('@/lib/cache/redis', () => ({
  isRedisConnected: () => mockIsRedisConnected(),
  default: { get: vi.fn(), setex: vi.fn() },
}))

vi.mock('@/services', () => ({
  studyProgramService: {
    list: vi.fn().mockResolvedValue([]),
    getGroupedByCluster: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))

import { GET as getPublicEvents } from '@/app/api/events/public/route'
import { GET as getStudyPrograms } from '@/app/api/study-programs/route'

const NON_LATIN1 = ['„Lehramt“', 'Kunst–Design', '🎓']

beforeEach(() => {
  vi.clearAllMocks()
  mockCacheGet.mockResolvedValue(null)
  mockIsRedisConnected.mockResolvedValue(true)
})

describe('public list APIs with characters above U+00FF in the query', () => {
  it.each(NON_LATIN1)('GET /api/events/public?search=%s answers 200 (cache miss)', async (q) => {
    const url = `http://test/api/events/public?search=${encodeURIComponent(q)}`
    const res = await getPublicEvents(new Request(url) as never)
    expect(res.status).toBe(200)
  })

  it('GET /api/events/public answers 200 for a cached search with German quotes', async () => {
    mockCacheGet.mockResolvedValue({ events: [], total: 0, page: 1, pageSize: 12, totalPages: 0 })
    const url = `http://test/api/events/public?search=${encodeURIComponent('„Lehramt“')}`
    const res = await getPublicEvents(new Request(url) as never)
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Cache')).toBe('HIT')
  })

  it('GET /api/study-programs answers 200 for an institution value with German quotes', async () => {
    const url = `http://test/api/study-programs?institution=${encodeURIComponent('„UNI“')}`
    const res = await getStudyPrograms(new Request(url) as never)
    expect(res.status).toBe(200)
  })
})
