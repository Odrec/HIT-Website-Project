import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockAuth = vi.fn()
const mockFindFirst = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()

vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    melder: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

import { POST } from '@/app/api/melder/upsert/route'

const baseBody = {
  firstName: 'Anja',
  lastName: 'Siemer',
  title: null,
  email: 'anja.siemer@zsb.os.de',
  phone: null,
  affiliation: 'UNI',
  fakultaet: null,
  fachbereich: null,
  room: null,
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/melder/upsert', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/melder/upsert', () => {
  it('rejects unauthenticated requests', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest(baseBody))
    expect(res.status).toBe(401)
  })

  it('rejects PUBLIC role', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'PUBLIC' } })
    const res = await POST(makeRequest(baseBody))
    expect(res.status).toBe(403)
  })

  it('rejects missing required fields', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } })
    const res = await POST(makeRequest({ ...baseBody, email: '' }))
    expect(res.status).toBe(400)
  })

  it('creates a new Melder when no email match exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } })
    mockFindFirst.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: 'm-new', ...baseBody, userId: null })
    const res = await POST(makeRequest(baseBody))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('m-new')
    expect(mockCreate).toHaveBeenCalledOnce()
    expect(mockCreate.mock.calls[0][0].data.userId).toBeNull()
    expect(mockCreate.mock.calls[0][0].data.email).toBe('anja.siemer@zsb.os.de')
  })

  it('matches existing Melder case-insensitively by email and updates it', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } })
    mockFindFirst.mockResolvedValue({ id: 'm-existing', email: 'Anja.Siemer@ZSB.OS.DE' })
    mockUpdate.mockResolvedValue({ id: 'm-existing', ...baseBody })
    const res = await POST(makeRequest(baseBody))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledOnce()
    expect(mockUpdate.mock.calls[0][0].where.id).toBe('m-existing')
    const findArg = mockFindFirst.mock.calls[0][0]
    const emailFilter = findArg.where.email
    expect(emailFilter.mode).toBe('insensitive')
  })

  it('rejects invalid affiliation', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } })
    const res = await POST(makeRequest({ ...baseBody, affiliation: 'GARBAGE' }))
    expect(res.status).toBe(400)
  })
})
