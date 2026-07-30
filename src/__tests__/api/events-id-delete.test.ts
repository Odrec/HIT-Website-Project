import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.fn()
const mockGetById = vi.fn()
const mockDelete = vi.fn()
const mockIsDeadlinePassed = vi.fn()

vi.mock('@/auth', () => ({ auth: () => mockAuth() }))
vi.mock('@/services', () => ({
  eventService: {
    getById: (...args: unknown[]) => mockGetById(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}))
vi.mock('@/services/edition-service', () => ({
  isDeadlinePassed: () => mockIsDeadlinePassed(),
}))
vi.mock('@/lib/email', () => ({ sendEventUpdatedEmail: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  mockIsDeadlinePassed.mockResolvedValue(false)
  mockDelete.mockResolvedValue({ id: 'e1' })
})

import { DELETE } from '@/app/api/events/[id]/route'

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) })
const req = () => new Request('http://x', { method: 'DELETE' }) as never

describe('DELETE /api/events/[id]', () => {
  it('rejects an unauthenticated request', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(req(), makeParams('e1'))
    expect(res.status).toBe(401)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('lets an admin delete any event', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin', role: 'ADMIN' } })
    mockGetById.mockResolvedValue({ id: 'e1', melder: { userId: 'someone-else' } })
    const res = await DELETE(req(), makeParams('e1'))
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledWith('e1')
  })

  it('lets an organizer delete their own event before the deadline', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ORGANIZER' } })
    mockGetById.mockResolvedValue({ id: 'e1', melder: { userId: 'u1' } })
    const res = await DELETE(req(), makeParams('e1'))
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledWith('e1')
  })

  it("refuses an organizer deleting someone else's event", async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ORGANIZER' } })
    mockGetById.mockResolvedValue({ id: 'e1', melder: { userId: 'u2' } })
    const res = await DELETE(req(), makeParams('e1'))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Nur eigene Veranstaltungen löschbar.' })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('refuses an organizer once the deadline has passed', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ORGANIZER' } })
    mockGetById.mockResolvedValue({ id: 'e1', melder: { userId: 'u1' } })
    mockIsDeadlinePassed.mockResolvedValue(true)
    const res = await DELETE(req(), makeParams('e1'))
    expect(res.status).toBe(403)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('rejects a PUBLIC user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'p1', role: 'PUBLIC' } })
    const res = await DELETE(req(), makeParams('e1'))
    expect(res.status).toBe(401)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns 404 for a missing event', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin', role: 'ADMIN' } })
    mockGetById.mockResolvedValue(null)
    const res = await DELETE(req(), makeParams('nope'))
    expect(res.status).toBe(404)
  })
})
