import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindFirst = vi.fn()
const mockFindMany = vi.fn()
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    event: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}))

vi.mock('@/lib/active-edition', () => ({
  getActiveEditionId: vi.fn().mockResolvedValue('active-id'),
  getActiveEdition: vi.fn().mockResolvedValue({
    id: 'active-id',
    year: 2027,
    hitDate: new Date('2027-11-18'),
    status: 'ACTIVE',
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockFindMany.mockResolvedValue([])
})

describe('GET /api/events/public/[id] cross-edition', () => {
  it('defaults to active edition when no ?edition= param', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'ev1',
      title: 'X',
      reviewStatus: 'PUBLISHED',
      studyPrograms: [],
      organizers: [],
      infoMarkets: [],
      lecturers: [],
    })
    const { GET } = await import('@/app/api/events/public/[id]/route')
    await GET(new Request('http://test/api/events/public/ev1') as never, {
      params: Promise.resolve({ id: 'ev1' }),
    })
    const call = mockFindFirst.mock.calls[0][0] as {
      where: { id: string; editionId?: string; reviewStatus?: string }
    }
    expect(call.where.editionId).toBe('active-id')
    expect(call.where.reviewStatus).toBe('PUBLISHED')
  })

  it('honors ?edition=<id> to resolve a past-edition PUBLISHED event', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'ev1',
      title: 'X',
      reviewStatus: 'PUBLISHED',
      studyPrograms: [],
      organizers: [],
      infoMarkets: [],
      lecturers: [],
    })
    const { GET } = await import('@/app/api/events/public/[id]/route')
    await GET(new Request('http://test/api/events/public/ev1?edition=ed-2026') as never, {
      params: Promise.resolve({ id: 'ev1' }),
    })
    const call = mockFindFirst.mock.calls[0][0] as {
      where: { id: string; editionId?: string; reviewStatus?: string }
    }
    expect(call.where.editionId).toBe('ed-2026')
    expect(call.where.reviewStatus).toBe('PUBLISHED')
  })

  it('returns 404 when the event is not found in the requested edition', async () => {
    mockFindFirst.mockResolvedValue(null)
    const { GET } = await import('@/app/api/events/public/[id]/route')
    const res = await GET(
      new Request('http://test/api/events/public/ev1?edition=ed-2026') as never,
      { params: Promise.resolve({ id: 'ev1' }) }
    )
    expect(res.status).toBe(404)
  })
})