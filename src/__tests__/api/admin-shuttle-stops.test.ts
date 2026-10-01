import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockAuth = vi.fn()
vi.mock('@/auth', () => ({ auth: () => mockAuth() }))
vi.mock('@/services/shuttle-stop-service', () => ({
  getShuttleStops: vi.fn(),
  createShuttleStop: vi.fn(),
  updateShuttleStop: vi.fn(),
  deleteShuttleStop: vi.fn(),
}))

import { GET, POST } from '@/app/api/admin/shuttle-stops/route'
import { PUT, DELETE } from '@/app/api/admin/shuttle-stops/[id]/route'
import {
  getShuttleStops,
  createShuttleStop,
  updateShuttleStop,
  deleteShuttleStop,
} from '@/services/shuttle-stop-service'

const stop = {
  id: 's1',
  name: 'Neuer Graben',
  coordinates: { latitude: 52.272345, longitude: 8.044123 },
  directionsNote: null,
}
const body = { name: 'Neuer Graben', latitude: 52.272345, longitude: 8.044123 }
const json = (url: string, method: string, payload: object) =>
  new NextRequest(url, { method, body: JSON.stringify(payload) })
const params = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } })
})

describe('admin shuttle-stops API', () => {
  it('is admin-only', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'ORGANIZER' } })
    expect((await GET()).status).toBe(401)
    expect((await POST(json('http://x', 'POST', body))).status).toBe(401)
    expect((await PUT(json('http://x', 'PUT', body), params('s1'))).status).toBe(401)
    expect((await DELETE(new NextRequest('http://x'), params('s1'))).status).toBe(401)
    expect(createShuttleStop).not.toHaveBeenCalled()
  })

  it('lists stops', async () => {
    vi.mocked(getShuttleStops).mockResolvedValue([stop])
    const res = await GET()
    expect(await res.json()).toEqual([stop])
  })

  it('creates a stop from a valid body', async () => {
    vi.mocked(createShuttleStop).mockResolvedValue(stop)
    const res = await POST(json('http://x', 'POST', body))
    expect(res.status).toBe(201)
    expect(createShuttleStop).toHaveBeenCalledWith({ ...body, directionsNote: null })
  })

  it('returns the validation message for an invalid body', async () => {
    const res = await POST(json('http://x', 'POST', { ...body, latitude: 'abc' }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Breitengrad ist keine gültige Zahl' })
    expect(createShuttleStop).not.toHaveBeenCalled()
  })

  it('updates a stop', async () => {
    vi.mocked(updateShuttleStop).mockResolvedValue(stop)
    const res = await PUT(json('http://x', 'PUT', body), params('s1'))
    expect(res.status).toBe(200)
    expect(updateShuttleStop).toHaveBeenCalledWith('s1', { ...body, directionsNote: null })
  })

  it('answers 404 for an unknown stop', async () => {
    vi.mocked(updateShuttleStop).mockResolvedValue(null)
    expect((await PUT(json('http://x', 'PUT', body), params('gone'))).status).toBe(404)
    vi.mocked(deleteShuttleStop).mockResolvedValue(false)
    expect((await DELETE(new NextRequest('http://x'), params('gone'))).status).toBe(404)
  })

  it('deletes a stop', async () => {
    vi.mocked(deleteShuttleStop).mockResolvedValue(true)
    const res = await DELETE(new NextRequest('http://x'), params('s1'))
    expect(res.status).toBe(200)
    expect(deleteShuttleStop).toHaveBeenCalledWith('s1')
  })
})
