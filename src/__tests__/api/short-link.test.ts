import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSharedFind = vi.fn()
const mockEditionFind = vi.fn()
const mockEventFind = vi.fn()
const mockEventFindMany = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    sharedSchedule: { findUnique: (...a: unknown[]) => mockSharedFind(...a) },
    hitEdition: { findUnique: (...a: unknown[]) => mockEditionFind(...a) },
    event: {
      findFirst: (...a: unknown[]) => mockEventFind(...a),
      findMany: (...a: unknown[]) => mockEventFindMany(...a),
    },
  },
}))

vi.mock('@/lib/active-edition', () => ({
  getActiveEditionId: vi.fn().mockResolvedValue('active-2027'),
  getActiveEdition: vi.fn().mockResolvedValue({
    id: 'active-2027',
    year: 2027,
    hitDate: new Date('2027-11-18'),
    status: 'ACTIVE',
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockEventFindMany.mockResolvedValue([])
})

describe('Cross-edition short-link resolution', () => {
  it('share payload carries the original (archived) editionId', async () => {
    mockSharedFind.mockResolvedValue({
      code: 'old26',
      eventIds: ['ev-archive-1'],
      editionId: 'archived-2026',
    })
    mockEditionFind.mockResolvedValue({ id: 'archived-2026', year: 2026 })

    const { GET } = await import('@/app/api/schedule/share/[code]/route')
    const res = await GET(new Request('http://test') as never, {
      params: Promise.resolve({ code: 'old26' }),
    })
    const body = await res.json()
    expect(body.editionId).toBe('archived-2026')
    expect(body.editionYear).toBe(2026)
    expect(body.eventIds).toEqual(['ev-archive-1'])
  })

  it('public event lookup with ?edition=<archived-id> resolves the archived event', async () => {
    mockEventFind.mockResolvedValue({
      id: 'ev-archive-1',
      title: 'Alt',
      reviewStatus: 'PUBLISHED',
      editionId: 'archived-2026',
      studyPrograms: [],
      organizers: [],
      infoMarkets: [],
      lecturers: [],
    })
    const { GET } = await import('@/app/api/events/public/[id]/route')
    await GET(
      new Request('http://test/api/events/public/ev-archive-1?edition=archived-2026') as never,
      { params: Promise.resolve({ id: 'ev-archive-1' }) }
    )
    const call = mockEventFind.mock.calls[0][0] as {
      where: { id: string; editionId?: string; reviewStatus?: string }
    }
    expect(call.where.editionId).toBe('archived-2026')
    expect(call.where.reviewStatus).toBe('PUBLISHED')
  })

  it('public event lookup without ?edition= uses the active edition', async () => {
    mockEventFind.mockResolvedValue({
      id: 'ev-new',
      title: 'Neu',
      reviewStatus: 'PUBLISHED',
      studyPrograms: [],
      organizers: [],
      infoMarkets: [],
      lecturers: [],
    })
    const { GET } = await import('@/app/api/events/public/[id]/route')
    await GET(new Request('http://test/api/events/public/ev-new') as never, {
      params: Promise.resolve({ id: 'ev-new' }),
    })
    const call = mockEventFind.mock.calls[0][0] as {
      where: { id: string; editionId?: string }
    }
    expect(call.where.editionId).toBe('active-2027')
  })
})