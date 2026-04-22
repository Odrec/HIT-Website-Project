import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } }) }))

const mockListEditions = vi.fn()
const mockCreateEdition = vi.fn()

vi.mock('@/services/edition-service', () => ({
  listEditions: (...args: unknown[]) => mockListEditions(...args),
  createEdition: (...args: unknown[]) => mockCreateEdition(...args),
  getEdition: vi.fn(),
  updateEdition: vi.fn(),
  deleteEdition: vi.fn(),
  activateEdition: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/editions', () => {
  it('returns editions list', async () => {
    mockListEditions.mockResolvedValue([{ id: 'e1', year: 2026 }])
    const { GET } = await import('@/app/api/editions/route')
    const res = await GET()
    expect(await res.json()).toEqual([{ id: 'e1', year: 2026 }])
  })
})

describe('POST /api/editions', () => {
  it('creates a new edition', async () => {
    mockCreateEdition.mockResolvedValue({ id: 'e2', year: 2027 })
    const { POST } = await import('@/app/api/editions/route')
    const req = new Request('http://test/api/editions', {
      method: 'POST',
      body: JSON.stringify({ year: 2027, hitDate: '2027-11-18' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: 'e2', year: 2027 })
  })

  it('rejects non-ADMIN callers', async () => {
    const { auth } = await import('@/auth')
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: { role: 'PUBLIC' } })
    const { POST } = await import('@/app/api/editions/route')
    const req = new Request('http://test/api/editions', {
      method: 'POST',
      body: JSON.stringify({ year: 2027, hitDate: '2027-11-18' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })
})