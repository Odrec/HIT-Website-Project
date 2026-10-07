import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } }) }))

const mockFindMany = vi.fn()
vi.mock('@/lib/db/prisma', () => ({
  prisma: { building: { findMany: (...a: unknown[]) => mockFindMany(...a) } },
}))

const mockGetWalkingRoute = vi.fn()
vi.mock('@/services/route-cache', () => ({
  getWalkingRoute: (...a: unknown[]) => mockGetWalkingRoute(...a),
}))

import { POST } from '@/app/api/routes/seed/route'

const building = (slug: string, campus: string, latitude: number, longitude: number) => ({
  slug,
  campus,
  latitude,
  longitude,
})

beforeEach(() => {
  vi.clearAllMocks()
  mockFindMany.mockResolvedValue([
    building('CN', 'Caprivi', 52.277552, 8.023436),
    building('11-aula', 'Innenstadt', 52.2715, 8.044231),
  ])
})

describe('POST /api/routes/seed', () => {
  it('refreshes stale routes through the shared cache instead of skipping them', async () => {
    mockGetWalkingRoute
      .mockResolvedValueOnce({ route: {}, source: 'google' }) // CN → 11: was stale, recomputed
      .mockResolvedValueOnce({ route: {}, source: 'cache' }) // 11 → CN: still valid

    const res = await POST(new Request('http://x', { method: 'POST' }))
    const body = await res.json()

    expect(mockGetWalkingRoute).toHaveBeenCalledWith(
      { slug: 'CN', coordinates: { latitude: 52.277552, longitude: 8.023436 } },
      { slug: '11-aula', coordinates: { latitude: 52.2715, longitude: 8.044231 } }
    )
    expect(body.summary).toEqual({ seeded: 1, skipped: 1, errors: 0, total: 2 })
  })

  it('reports Google failures per pair', async () => {
    mockGetWalkingRoute.mockRejectedValue(new Error('REQUEST_DENIED'))
    const body = await (await POST(new Request('http://x', { method: 'POST' }))).json()
    expect(body.summary.errors).toBe(2)
    expect(body.results[0].status).toBe('error: REQUEST_DENIED')
  })
})
