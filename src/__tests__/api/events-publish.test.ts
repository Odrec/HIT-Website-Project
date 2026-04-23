import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } }) }))

const mockPublish = vi.fn()
vi.mock('@/services', () => ({
  eventService: {
    publish: (...args: unknown[]) => mockPublish(...args),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/events/[id]/publish', () => {
  it('flips the event to PUBLISHED', async () => {
    mockPublish.mockResolvedValue({ id: 'ev1', reviewStatus: 'PUBLISHED' })
    const { POST } = await import('@/app/api/events/[id]/publish/route')
    const res = await POST(new Request('http://test', { method: 'POST' }), {
      params: Promise.resolve({ id: 'ev1' }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(mockPublish).toHaveBeenCalledWith('ev1')
  })

  it('returns 400 when service throws', async () => {
    mockPublish.mockRejectedValue(new Error('Record not found'))
    const { POST } = await import('@/app/api/events/[id]/publish/route')
    const res = await POST(new Request('http://test', { method: 'POST' }), {
      params: Promise.resolve({ id: 'missing' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects non-ADMIN callers', async () => {
    const { auth } = await import('@/auth')
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: { role: 'PUBLIC' } })
    const { POST } = await import('@/app/api/events/[id]/publish/route')
    const res = await POST(new Request('http://test', { method: 'POST' }), {
      params: Promise.resolve({ id: 'ev1' }),
    })
    expect(res.status).toBe(403)
  })
})
