import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockAuth = vi.fn()
const mockFindUnique = vi.fn()
const mockUpdate = vi.fn()
const mockCreate = vi.fn()

vi.mock('@/auth', () => ({ auth: () => mockAuth() }))
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    building: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}))
vi.mock('@/lib/cache/cache-utils', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  invalidateBuildingCaches: vi.fn(),
}))
vi.mock('@/lib/cache/redis', () => ({ isRedisConnected: vi.fn().mockResolvedValue(false) }))

import { PUT } from '@/app/api/buildings/[id]/route'
import { POST } from '@/app/api/buildings/route'

const params = { params: Promise.resolve({ id: 'b04' }) }
const put = (body: object) =>
  PUT(
    new NextRequest('http://x/api/buildings/b04', { method: 'PUT', body: JSON.stringify(body) }),
    params
  )
const post = (body: object) =>
  POST(new NextRequest('http://x/api/buildings', { method: 'POST', body: JSON.stringify(body) }))

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } })
  mockFindUnique.mockResolvedValue({ id: 'b04', hasAccessibility: false })
  mockUpdate.mockImplementation(({ data }) => ({ id: 'b04', ...data }))
  mockCreate.mockImplementation(({ data }) => ({ id: 'new', ...data }))
})

describe('PUT /api/buildings/[id] coordinates', () => {
  it('stores six-decimal coordinates unchanged', async () => {
    const res = await put({ name: '04', latitude: 52.271234, longitude: 8.045678 })
    expect(res.status).toBe(200)
    expect(mockUpdate.mock.calls[0][0].data).toMatchObject({
      latitude: 52.271234,
      longitude: 8.045678,
    })
  })

  it('rejects a non-numeric coordinate with a German message instead of a 500', async () => {
    const res = await put({ name: '04', latitude: 'abc', longitude: 8.04 })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Breitengrad ist keine gültige Zahl' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('rejects a half-filled pair', async () => {
    const res = await put({ name: '04', latitude: 52.27, longitude: null })
    expect(res.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('still allows clearing both coordinates', async () => {
    const res = await put({ name: '04', latitude: null, longitude: null })
    expect(res.status).toBe(200)
    expect(mockUpdate.mock.calls[0][0].data).toMatchObject({ latitude: null, longitude: null })
  })
})

describe('POST /api/buildings coordinates', () => {
  it('rejects an out-of-range latitude', async () => {
    const res = await post({ name: 'Neu', latitude: 152.27, longitude: 8.04 })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Breitengrad muss zwischen -90 und 90 liegen' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates a building with coordinates', async () => {
    const res = await post({ name: 'Neu', latitude: '52,271234', longitude: '8,045678' })
    expect(res.status).toBe(201)
    expect(mockCreate.mock.calls[0][0].data).toMatchObject({
      latitude: 52.271234,
      longitude: 8.045678,
    })
  })
})
