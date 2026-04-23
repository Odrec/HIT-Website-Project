import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { role: 'ADMIN', id: 'admin-1' } }),
}))

const mockGetById = vi.fn()
const mockUpdate = vi.fn()
vi.mock('@/services', () => ({
  eventService: {
    getById: (...args: unknown[]) => mockGetById(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}))

vi.mock('@/lib/email', () => ({
  sendEventUpdatedEmail: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PUT /api/events/[id] — reviewStatus auto-promote', () => {
  it('promotes DRAFT_FROM_ROLLOVER to NEEDS_REVIEW on admin save', async () => {
    mockGetById.mockResolvedValue({
      id: 'ev1',
      reviewStatus: 'DRAFT_FROM_ROLLOVER',
      melderId: null,
      title: 'orig',
    })
    mockUpdate.mockResolvedValue({ id: 'ev1', reviewStatus: 'NEEDS_REVIEW', title: 'edited' })

    const { PUT } = await import('@/app/api/events/[id]/route')
    const req = new Request('http://test', {
      method: 'PUT',
      body: JSON.stringify({ title: 'edited' }),
    })
    await PUT(req as never, { params: Promise.resolve({ id: 'ev1' }) })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ev1', reviewStatus: 'NEEDS_REVIEW' })
    )
  })

  it('does not alter reviewStatus when current is NEEDS_REVIEW', async () => {
    mockGetById.mockResolvedValue({
      id: 'ev1',
      reviewStatus: 'NEEDS_REVIEW',
      melderId: null,
      title: 'orig',
    })
    mockUpdate.mockResolvedValue({ id: 'ev1' })

    const { PUT } = await import('@/app/api/events/[id]/route')
    const req = new Request('http://test', {
      method: 'PUT',
      body: JSON.stringify({ title: 'edited' }),
    })
    await PUT(req as never, { params: Promise.resolve({ id: 'ev1' }) })

    const call = mockUpdate.mock.calls[0][0] as { reviewStatus?: string }
    expect(call.reviewStatus).toBeUndefined()
  })

  it('does not alter reviewStatus when current is PUBLISHED', async () => {
    mockGetById.mockResolvedValue({
      id: 'ev1',
      reviewStatus: 'PUBLISHED',
      melderId: null,
      title: 'orig',
    })
    mockUpdate.mockResolvedValue({ id: 'ev1' })

    const { PUT } = await import('@/app/api/events/[id]/route')
    const req = new Request('http://test', {
      method: 'PUT',
      body: JSON.stringify({ title: 'edited' }),
    })
    await PUT(req as never, { params: Promise.resolve({ id: 'ev1' }) })

    const call = mockUpdate.mock.calls[0][0] as { reviewStatus?: string }
    expect(call.reviewStatus).toBeUndefined()
  })

  it('respects an explicit reviewStatus in the body', async () => {
    mockGetById.mockResolvedValue({
      id: 'ev1',
      reviewStatus: 'DRAFT_FROM_ROLLOVER',
      melderId: null,
      title: 'orig',
    })
    mockUpdate.mockResolvedValue({ id: 'ev1' })

    const { PUT } = await import('@/app/api/events/[id]/route')
    const req = new Request('http://test', {
      method: 'PUT',
      body: JSON.stringify({ title: 'edited', reviewStatus: 'PUBLISHED' }),
    })
    await PUT(req as never, { params: Promise.resolve({ id: 'ev1' }) })

    const call = mockUpdate.mock.calls[0][0] as { reviewStatus?: string }
    expect(call.reviewStatus).toBe('PUBLISHED')
  })
})
