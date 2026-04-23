import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } }) }))

const mockRollover = vi.fn()
vi.mock('@/services/edition-service', () => ({
  rollover: (...args: unknown[]) => mockRollover(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/editions/rollover', () => {
  it('creates the new edition and returns clone count', async () => {
    mockRollover.mockResolvedValue({
      edition: { id: 'new', year: 2027, status: 'ACTIVE' },
      clonedCount: 17,
    })
    const { POST } = await import('@/app/api/editions/rollover/route')
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({
        year: 2027,
        hitDate: '2027-11-18',
        submissionDeadline: '2027-10-01',
        cloneEvents: true,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.edition.year).toBe(2027)
    expect(body.clonedCount).toBe(17)
    expect(mockRollover).toHaveBeenCalledWith({
      year: 2027,
      hitDate: new Date('2027-11-18'),
      submissionDeadline: new Date('2027-10-01'),
      cloneEvents: true,
    })
  })

  it('accepts null submissionDeadline', async () => {
    mockRollover.mockResolvedValue({ edition: { id: 'new' }, clonedCount: 0 })
    const { POST } = await import('@/app/api/editions/rollover/route')
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({
        year: 2027,
        hitDate: '2027-11-18',
        submissionDeadline: null,
        cloneEvents: false,
      }),
    })
    await POST(req)
    expect(mockRollover).toHaveBeenCalledWith(
      expect.objectContaining({ submissionDeadline: null, cloneEvents: false })
    )
  })

  it('returns 400 on non-integer year', async () => {
    const { POST } = await import('@/app/api/editions/rollover/route')
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({ year: 'not-a-number', hitDate: '2027-11-18', cloneEvents: true }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 on invalid hitDate', async () => {
    const { POST } = await import('@/app/api/editions/rollover/route')
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({ year: 2027, hitDate: 'garbage', cloneEvents: true }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when service throws', async () => {
    mockRollover.mockRejectedValue(new Error('Unique constraint failed'))
    const { POST } = await import('@/app/api/editions/rollover/route')
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({ year: 2027, hitDate: '2027-11-18', cloneEvents: true }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Unique constraint failed' })
  })

  it('rejects non-ADMIN callers', async () => {
    const { auth } = await import('@/auth')
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: { role: 'PUBLIC' } })
    const { POST } = await import('@/app/api/editions/rollover/route')
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({ year: 2027, hitDate: '2027-11-18', cloneEvents: true }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })
})