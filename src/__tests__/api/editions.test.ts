import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } }) }))

const mockListEditions = vi.fn()
const mockCreateEdition = vi.fn()
const mockGetEdition = vi.fn()
const mockUpdateEdition = vi.fn()
const mockDeleteEdition = vi.fn()

vi.mock('@/services/edition-service', () => ({
  listEditions: (...args: unknown[]) => mockListEditions(...args),
  createEdition: (...args: unknown[]) => mockCreateEdition(...args),
  getEdition: (...args: unknown[]) => mockGetEdition(...args),
  updateEdition: (...args: unknown[]) => mockUpdateEdition(...args),
  deleteEdition: (...args: unknown[]) => mockDeleteEdition(...args),
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

describe('GET /api/editions (auth)', () => {
  it('rejects non-admin callers', async () => {
    const { auth } = await import('@/auth')
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: { role: 'PUBLIC' } })
    const { GET } = await import('@/app/api/editions/route')
    const res = await GET()
    expect(res.status).toBe(403)
  })
})

describe('GET /api/editions/[id]', () => {
  it('returns 404 when edition missing', async () => {
    mockGetEdition.mockResolvedValue(null)
    const { GET } = await import('@/app/api/editions/[id]/route')
    const res = await GET(new Request('http://test'), {
      params: Promise.resolve({ id: 'missing' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns edition when found', async () => {
    mockGetEdition.mockResolvedValue({ id: 'e1', year: 2026 })
    const { GET } = await import('@/app/api/editions/[id]/route')
    const res = await GET(new Request('http://test'), { params: Promise.resolve({ id: 'e1' }) })
    expect(await res.json()).toEqual({ id: 'e1', year: 2026 })
  })
})

describe('PUT /api/editions/[id]', () => {
  it('calls updateEdition with spread fields', async () => {
    mockUpdateEdition.mockResolvedValue({ id: 'e1', year: 2026 })
    const { PUT } = await import('@/app/api/editions/[id]/route')
    const req = new Request('http://test', {
      method: 'PUT',
      body: JSON.stringify({ hitDate: '2026-11-19', deadlineEnabled: false }),
    })
    await PUT(req, { params: Promise.resolve({ id: 'e1' }) })
    expect(mockUpdateEdition).toHaveBeenCalledWith(
      'e1',
      expect.objectContaining({
        hitDate: expect.any(Date),
        deadlineEnabled: false,
      })
    )
  })

  it('returns 400 on invalid hitDate', async () => {
    const { PUT } = await import('@/app/api/editions/[id]/route')
    const req = new Request('http://test', {
      method: 'PUT',
      body: JSON.stringify({ hitDate: 'not-a-date' }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: 'e1' }) })
    expect(res.status).toBe(400)
  })

  it('rejects non-admin', async () => {
    const { auth } = await import('@/auth')
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: { role: 'PUBLIC' } })
    const { PUT } = await import('@/app/api/editions/[id]/route')
    const req = new Request('http://test', {
      method: 'PUT',
      body: JSON.stringify({ action: 'activate' }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: 'e1' }) })
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/editions/[id]', () => {
  it('deletes edition on success', async () => {
    mockDeleteEdition.mockResolvedValue(undefined)
    const { DELETE } = await import('@/app/api/editions/[id]/route')
    const res = await DELETE(new Request('http://test'), { params: Promise.resolve({ id: 'e1' }) })
    expect(res.status).toBe(200)
    expect(mockDeleteEdition).toHaveBeenCalledWith('e1')
  })

  it('returns 400 when service throws', async () => {
    mockDeleteEdition.mockRejectedValue(new Error('has events'))
    const { DELETE } = await import('@/app/api/editions/[id]/route')
    const res = await DELETE(new Request('http://test'), { params: Promise.resolve({ id: 'e1' }) })
    expect(res.status).toBe(400)
  })

  it('rejects non-admin', async () => {
    const { auth } = await import('@/auth')
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: { role: 'PUBLIC' } })
    const { DELETE } = await import('@/app/api/editions/[id]/route')
    const res = await DELETE(new Request('http://test'), { params: Promise.resolve({ id: 'e1' }) })
    expect(res.status).toBe(403)
  })
})

describe('POST /api/editions validation', () => {
  it('returns 400 when year is missing or non-numeric', async () => {
    const { POST } = await import('@/app/api/editions/route')
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({ year: 'not-a-number', hitDate: '2027-11-18' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when hitDate is invalid', async () => {
    const { POST } = await import('@/app/api/editions/route')
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({ year: 2027, hitDate: 'garbage' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
