import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } }) }))

const mockListPruefstand = vi.fn()
vi.mock('@/services', () => ({
  eventService: {
    listPruefstand: (...args: unknown[]) => mockListPruefstand(...args),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/events/pruefstand', () => {
  it('returns Prüfstand events for the active edition by default', async () => {
    mockListPruefstand.mockResolvedValue([
      { id: 'ev1', title: 'Foo', reviewStatus: 'DRAFT_FROM_ROLLOVER' },
    ])
    const { GET } = await import('@/app/api/events/pruefstand/route')
    const res = await GET(new Request('http://test/api/events/pruefstand'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([
      { id: 'ev1', title: 'Foo', reviewStatus: 'DRAFT_FROM_ROLLOVER' },
    ])
    expect(mockListPruefstand).toHaveBeenCalledWith({})
  })

  it('passes reviewStatus and search from query params', async () => {
    mockListPruefstand.mockResolvedValue([])
    const { GET } = await import('@/app/api/events/pruefstand/route')
    await GET(
      new Request('http://test/api/events/pruefstand?reviewStatus=NEEDS_REVIEW&search=Phys')
    )
    expect(mockListPruefstand).toHaveBeenCalledWith({
      reviewStatus: 'NEEDS_REVIEW',
      search: 'Phys',
    })
  })

  it('ignores unknown reviewStatus values', async () => {
    mockListPruefstand.mockResolvedValue([])
    const { GET } = await import('@/app/api/events/pruefstand/route')
    await GET(new Request('http://test/api/events/pruefstand?reviewStatus=garbage'))
    expect(mockListPruefstand).toHaveBeenCalledWith({})
  })

  it('rejects non-ADMIN callers', async () => {
    const { auth } = await import('@/auth')
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: { role: 'PUBLIC' } })
    const { GET } = await import('@/app/api/events/pruefstand/route')
    const res = await GET(new Request('http://test/api/events/pruefstand'))
    expect(res.status).toBe(403)
  })
})