import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } }) }))

const mockCountPruefstand = vi.fn()
vi.mock('@/services', () => ({
  eventService: {
    countPruefstand: (...args: unknown[]) => mockCountPruefstand(...args),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/events/pruefstand/count', () => {
  it('returns the Prüfstand count for the active edition', async () => {
    mockCountPruefstand.mockResolvedValue(3)
    const { GET } = await import('@/app/api/events/pruefstand/count/route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ count: 3 })
  })

  it('rejects non-ADMIN callers', async () => {
    const { auth } = await import('@/auth')
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: { role: 'PUBLIC' } })
    const { GET } = await import('@/app/api/events/pruefstand/count/route')
    const res = await GET()
    expect(res.status).toBe(403)
  })
})