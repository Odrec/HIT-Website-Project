import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock prisma
const mockCreate = vi.fn()
const mockFindUnique = vi.fn()
const mockFindFirst = vi.fn()
const mockEditionFindUnique = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    sharedSchedule: {
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    hitEdition: {
      findUnique: (...args: unknown[]) => mockEditionFindUnique(...args),
    },
  },
}))

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: () => 'abc123',
}))

// Mock active-edition resolver
vi.mock('@/lib/active-edition', () => ({
  getActiveEditionId: vi.fn().mockResolvedValue('active-edition-id'),
}))

import { POST } from '@/app/api/schedule/share/route'
import { GET } from '@/app/api/schedule/share/[code]/route'

describe('POST /api/schedule/share', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a shared schedule and returns code + url', async () => {
    mockFindFirst.mockResolvedValue(null)
    mockCreate.mockResolvedValue({
      id: 'clx1',
      code: 'abc123',
      eventIds: ['event1', 'event2'],
    })

    const request = new Request('http://localhost/api/schedule/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventIds: ['event2', 'event1'] }),
    })

    const response = await POST(request as unknown as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.code).toBe('abc123')
    expect(data.url).toContain('/s/abc123')
  })

  it('returns existing code for duplicate eventIds', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'clx1',
      code: 'xyz789',
      eventIds: ['event1', 'event2'],
    })

    const request = new Request('http://localhost/api/schedule/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventIds: ['event2', 'event1'] }),
    })

    const response = await POST(request as unknown as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.code).toBe('xyz789')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('uses NEXTAUTH_URL for the share origin instead of request host', async () => {
    vi.stubEnv('NEXTAUTH_URL', 'https://hit.zsb.os.de')
    mockFindFirst.mockResolvedValue(null)
    mockCreate.mockResolvedValue({
      id: 'clx1',
      code: 'abc123',
      eventIds: ['event1'],
    })

    const request = new Request('http://0.0.0.0:3000/api/schedule/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventIds: ['event1'] }),
    })

    const response = await POST(request as unknown as NextRequest)
    const data = await response.json()

    expect(data.url).toBe('https://hit.zsb.os.de/s/abc123')
    vi.unstubAllEnvs()
  })

  it('falls back to x-forwarded-host when NEXTAUTH_URL is unset', async () => {
    vi.stubEnv('NEXTAUTH_URL', '')
    mockFindFirst.mockResolvedValue(null)
    mockCreate.mockResolvedValue({
      id: 'clx1',
      code: 'abc123',
      eventIds: ['event1'],
    })

    const request = new Request('http://0.0.0.0:3000/api/schedule/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-host': 'hit-website-virtuos-openstack.uni-osnabrueck.de',
        'x-forwarded-proto': 'https',
      },
      body: JSON.stringify({ eventIds: ['event1'] }),
    })

    const response = await POST(request as unknown as NextRequest)
    const data = await response.json()

    expect(data.url).toBe('https://hit-website-virtuos-openstack.uni-osnabrueck.de/s/abc123')
    vi.unstubAllEnvs()
  })

  it('returns 400 for missing eventIds', async () => {
    const request = new Request('http://localhost/api/schedule/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request as unknown as NextRequest)
    expect(response.status).toBe(400)
  })
})

describe('GET /api/schedule/share/[code]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns eventIds for valid code', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'clx1',
      code: 'abc123',
      eventIds: ['event1', 'event2'],
    })

    const request = new Request('http://localhost/api/schedule/share/abc123')
    const response = await GET(request as unknown as NextRequest, {
      params: Promise.resolve({ code: 'abc123' }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.eventIds).toEqual(['event1', 'event2'])
  })

  it('returns 404 for unknown code', async () => {
    mockFindUnique.mockResolvedValue(null)

    const request = new Request('http://localhost/api/schedule/share/nope99')
    const response = await GET(request as unknown as NextRequest, {
      params: Promise.resolve({ code: 'nope99' }),
    })

    expect(response.status).toBe(404)
  })
})

describe('GET /api/schedule/share/[code] edition context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns eventIds, editionId, and editionYear', async () => {
    mockFindUnique.mockResolvedValue({
      code: 'abc123',
      eventIds: ['ev1', 'ev2'],
      editionId: 'ed-2026',
    })
    mockEditionFindUnique.mockResolvedValue({
      id: 'ed-2026',
      year: 2026,
    })

    const response = await GET(new Request('http://test') as unknown as NextRequest, {
      params: Promise.resolve({ code: 'abc123' }),
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      eventIds: ['ev1', 'ev2'],
      editionId: 'ed-2026',
      editionYear: 2026,
    })
  })

  it('returns 404 when the code does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)

    const response = await GET(new Request('http://test') as unknown as NextRequest, {
      params: Promise.resolve({ code: 'missing' }),
    })
    expect(response.status).toBe(404)
  })
})
