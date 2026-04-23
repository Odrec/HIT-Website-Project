import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } }) }))

const mockActivateEdition = vi.fn()
vi.mock('@/services/edition-service', () => ({
  activateEdition: (...args: unknown[]) => mockActivateEdition(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/editions/[id]/activate', () => {
  it('activates the target edition', async () => {
    mockActivateEdition.mockResolvedValue(undefined)
    const { POST } = await import('@/app/api/editions/[id]/activate/route')
    const res = await POST(new Request('http://test', { method: 'POST' }), {
      params: Promise.resolve({ id: 'e1' }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(mockActivateEdition).toHaveBeenCalledWith('e1')
  })

  it('returns 400 when service throws', async () => {
    mockActivateEdition.mockRejectedValue(new Error('Edition not found'))
    const { POST } = await import('@/app/api/editions/[id]/activate/route')
    const res = await POST(new Request('http://test', { method: 'POST' }), {
      params: Promise.resolve({ id: 'missing' }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Edition not found' })
  })

  it('rejects non-ADMIN callers', async () => {
    const { auth } = await import('@/auth')
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: { role: 'PUBLIC' } })
    const { POST } = await import('@/app/api/editions/[id]/activate/route')
    const res = await POST(new Request('http://test', { method: 'POST' }), {
      params: Promise.resolve({ id: 'e1' }),
    })
    expect(res.status).toBe(403)
  })
})
