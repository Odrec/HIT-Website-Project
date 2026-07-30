import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.fn()
const mockFindMany = vi.fn()

vi.mock('@/auth', () => ({ auth: () => mockAuth() }))
vi.mock('@/lib/db/prisma', () => ({
  prisma: { melder: { findMany: (...args: unknown[]) => mockFindMany(...args) } },
}))

beforeEach(() => vi.clearAllMocks())

import { GET } from '@/app/api/melder/options/route'

describe('GET /api/melder/options', () => {
  it('requires admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ORGANIZER' } })
    const res = await GET()
    expect(res.status).toBe(403)
    expect(mockFindMany).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated callers', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('returns Melder sorted in German order by last name', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'a1', role: 'ADMIN' } })
    mockFindMany.mockResolvedValue([
      { id: '1', firstName: 'Anna', lastName: 'Zieler', email: 'z@x.de' },
      { id: '2', firstName: 'Bea', lastName: 'Österle', email: 'oe@x.de' },
      { id: '3', firstName: 'Cem', lastName: 'Osterloh', email: 'os@x.de' },
    ])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.map((m: { lastName: string }) => m.lastName)).toEqual([
      'Österle',
      'Osterloh',
      'Zieler',
    ])
  })

  it('does not leak the linked user account', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'a1', role: 'ADMIN' } })
    mockFindMany.mockResolvedValue([{ id: '1', firstName: 'A', lastName: 'B', email: 'a@b.de' }])
    await GET()
    const select = mockFindMany.mock.calls[0][0].select
    expect(select).toBeDefined()
    expect(select.user).toBeUndefined()
    expect(select.userId).toBeUndefined()
  })
})
