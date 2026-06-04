import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/services/shuttle-service', () => ({
  validateGuideToken: vi.fn(),
  setBusPause: vi.fn(),
  resumeBus: vi.fn(),
  getGuideBusState: vi.fn(),
}))

import { GET, POST } from '@/app/api/bus-positions/pause/route'
import {
  validateGuideToken,
  setBusPause,
  resumeBus,
  getGuideBusState,
} from '@/services/shuttle-service'

const mockValidate = vi.mocked(validateGuideToken)
const mockSet = vi.mocked(setBusPause)
const mockResume = vi.mocked(resumeBus)
const mockGetState = vi.mocked(getGuideBusState)

const req = (body: unknown, auth = 'Bearer valid') =>
  new NextRequest('http://localhost/api/bus-positions/pause', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(body),
  })

const bus = { id: 'bus1', number: 1, name: 'Bus 1', active: true }

describe('GET /api/bus-positions/pause', () => {
  beforeEach(() => vi.clearAllMocks())

  const getReq = (auth?: string) =>
    new NextRequest('http://localhost/api/bus-positions/pause', {
      headers: auth ? { Authorization: auth } : {},
    })

  it('401 without auth header', async () => {
    expect((await GET(getReq())).status).toBe(401)
  })

  it('401 with invalid token', async () => {
    mockGetState.mockResolvedValue(null)
    expect((await GET(getReq('Bearer bad'))).status).toBe(401)
  })

  it('returns busName + pause state for a valid token', async () => {
    mockGetState.mockResolvedValue({
      busName: 'Bus 1',
      paused: true,
      pausedUntil: '2026-11-19T12:00:00.000Z',
    })
    const res = await GET(getReq('Bearer valid'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toMatchObject({
      ok: true,
      busName: 'Bus 1',
      paused: true,
      pausedUntil: '2026-11-19T12:00:00.000Z',
    })
  })
})

describe('POST /api/bus-positions/pause', () => {
  beforeEach(() => vi.clearAllMocks())

  it('401 without auth header', async () => {
    const r = new NextRequest('http://localhost/api/bus-positions/pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'open' }),
    })
    expect((await POST(r)).status).toBe(401)
  })

  it('401 with invalid token', async () => {
    mockValidate.mockResolvedValue(null)
    expect((await POST(req({ mode: 'open' }))).status).toBe(401)
  })

  it('timed pause calls setBusPause with a future date', async () => {
    mockValidate.mockResolvedValue(bus)
    const res = await POST(req({ mode: 'until', minutes: 30 }))
    expect(res.status).toBe(200)
    expect(mockSet).toHaveBeenCalledTimes(1)
    const arg = mockSet.mock.calls[0][1]
    expect(arg.indefinite).toBe(false)
    expect(arg.until!.getTime()).toBeGreaterThan(Date.now())
  })

  it('400 on bad minutes', async () => {
    mockValidate.mockResolvedValue(bus)
    expect((await POST(req({ mode: 'until', minutes: 0 }))).status).toBe(400)
    expect((await POST(req({ mode: 'until', minutes: 999 }))).status).toBe(400)
  })

  it('open pause calls setBusPause indefinite', async () => {
    mockValidate.mockResolvedValue(bus)
    await POST(req({ mode: 'open' }))
    expect(mockSet).toHaveBeenCalledWith('bus1', { until: null, indefinite: true })
  })

  it('resume calls resumeBus', async () => {
    mockValidate.mockResolvedValue(bus)
    await POST(req({ mode: 'resume' }))
    expect(mockResume).toHaveBeenCalledWith('bus1')
  })

  it('400 on invalid mode', async () => {
    mockValidate.mockResolvedValue(bus)
    expect((await POST(req({ mode: 'nope' }))).status).toBe(400)
  })
})
