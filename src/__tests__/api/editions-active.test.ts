import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetActiveEdition = vi.fn()
vi.mock('@/lib/active-edition', () => ({
  getActiveEdition: (...args: unknown[]) => mockGetActiveEdition(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/editions/active', () => {
  it('returns the active edition', async () => {
    mockGetActiveEdition.mockResolvedValue({ id: 'e1', year: 2026, status: 'ACTIVE' })
    const { GET } = await import('@/app/api/editions/active/route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id: 'e1', year: 2026, status: 'ACTIVE' })
  })

  it('returns 500 when no active edition', async () => {
    mockGetActiveEdition.mockRejectedValue(new Error('No ACTIVE HitEdition'))
    const { GET } = await import('@/app/api/editions/active/route')
    const res = await GET()
    expect(res.status).toBe(500)
  })
})