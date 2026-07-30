import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.fn()
const mockFindMany = vi.fn()
const mockUpsert = vi.fn()
const mockDeleteMany = vi.fn()

vi.mock('@/auth', () => ({ auth: () => mockAuth() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    contentText: {
      findMany: (...a: unknown[]) => mockFindMany(...a),
      upsert: (...a: unknown[]) => mockUpsert(...a),
      deleteMany: (...a: unknown[]) => mockDeleteMany(...a),
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockFindMany.mockResolvedValue([])
})

import { GET, PUT, DELETE } from '@/app/api/admin/content-texts/route'

const asAdmin = () => mockAuth.mockResolvedValue({ user: { id: 'a1', role: 'ADMIN' } })

describe('/api/admin/content-texts', () => {
  it('GET requires admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ORGANIZER' } })
    expect((await GET()).status).toBe(403)
  })

  it('GET returns slots and merged values', async () => {
    asAdmin()
    const res = await GET()
    const body = await res.json()
    expect(Array.isArray(body.slots)).toBe(true)
    expect(body.values['home.uni.bullet.students']).toBe('13.000+ Studierende')
  })

  it('PUT requires admin', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new Request('http://x', {
      method: 'PUT',
      body: JSON.stringify({ key: 'home.hero.title', value: 'X' }),
    })
    expect((await PUT(req as never)).status).toBe(403)
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('PUT rejects an unknown slot key', async () => {
    asAdmin()
    const req = new Request('http://x', {
      method: 'PUT',
      body: JSON.stringify({ key: 'not.a.slot', value: 'X' }),
    })
    expect((await PUT(req as never)).status).toBe(400)
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('PUT stores the override with the editing user', async () => {
    asAdmin()
    mockUpsert.mockResolvedValue({})
    const req = new Request('http://x', {
      method: 'PUT',
      body: JSON.stringify({ key: 'home.hero.title', value: 'Neuer Titel' }),
    })
    expect((await PUT(req as never)).status).toBe(200)
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { key: 'home.hero.title' },
      create: { key: 'home.hero.title', value: 'Neuer Titel', updatedBy: 'a1' },
      update: { value: 'Neuer Titel', updatedBy: 'a1' },
    })
  })

  it('DELETE resets a slot to its default', async () => {
    asAdmin()
    mockDeleteMany.mockResolvedValue({ count: 1 })
    const req = new Request('http://x/api/admin/content-texts?key=home.hero.title', {
      method: 'DELETE',
    })
    expect((await DELETE(req as never)).status).toBe(200)
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { key: 'home.hero.title' } })
  })
})
