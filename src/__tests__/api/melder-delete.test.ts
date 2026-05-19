import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.fn()
const mockFindUnique = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/auth', () => ({ auth: () => mockAuth() }))
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    melder: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}))

beforeEach(() => vi.clearAllMocks())

import { DELETE } from '@/app/api/melder/[id]/route'

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) })

describe('DELETE /api/melder/[id]', () => {
  it('requires admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ORGANIZER' } })
    const res = await DELETE(new Request('http://x'), makeParams('m1'))
    expect(res.status).toBe(403)
  })

  it('refuses to delete a Melder still linked to events', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } })
    mockFindUnique.mockResolvedValue({ id: 'm1', _count: { events: 3 } })
    const res = await DELETE(new Request('http://x'), makeParams('m1'))
    expect(res.status).toBe(409)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes a Melder with no events', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } })
    mockFindUnique.mockResolvedValue({ id: 'm1', _count: { events: 0 } })
    mockDelete.mockResolvedValue({ id: 'm1' })
    const res = await DELETE(new Request('http://x'), makeParams('m1'))
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'm1' } })
  })

  it('returns 404 when Melder does not exist', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } })
    mockFindUnique.mockResolvedValue(null)
    const res = await DELETE(new Request('http://x'), makeParams('nope'))
    expect(res.status).toBe(404)
  })
})
