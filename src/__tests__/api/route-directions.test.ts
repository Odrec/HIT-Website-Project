import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindUnique = vi.fn()
const mockUpsert = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    cachedRoute: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}))

vi.mock('@/services/google-directions', () => ({
  fetchWalkingDirections: vi.fn().mockResolvedValue({
    distanceMeters: 1850,
    durationSeconds: 1500,
    polyline: 'encoded_polyline',
    waypoints: [
      [52.27, 8.04],
      [52.28, 8.02],
    ],
  }),
}))

import { fetchWalkingDirections } from '@/services/google-directions'

// Mock route-service building lookup
vi.mock('@/services/route-service', () => ({
  findBuilding: vi.fn((id: string) => {
    const buildings: Record<string, { coordinates: { latitude: number; longitude: number } }> = {
      schloss: { coordinates: { latitude: 52.2725, longitude: 8.044 } },
      avz: { coordinates: { latitude: 52.2833, longitude: 8.0233 } },
    }
    return buildings[id] || null
  }),
}))

import { GET } from '@/app/api/routes/directions/route'

describe('GET /api/routes/directions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const cachedRow = {
    distanceMeters: 1850,
    durationSeconds: 1500,
    waypoints: [
      [52.27, 8.04],
      [52.28, 8.02],
    ],
    // positions the route was computed from = current schloss/avz positions
    fromLatitude: 52.2725,
    fromLongitude: 8.044,
    toLatitude: 52.2833,
    toLongitude: 8.0233,
  }

  it('returns cached route when available', async () => {
    mockFindUnique.mockResolvedValue(cachedRow)

    const request = new Request('http://localhost/api/routes/directions?from=schloss&to=avz')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.distanceMeters).toBe(1850)
    expect(mockFindUnique).toHaveBeenCalledOnce()
    expect(fetchWalkingDirections).not.toHaveBeenCalled()
  })

  it('recomputes a cached route once a building has moved', async () => {
    mockFindUnique.mockResolvedValue({ ...cachedRow, distanceMeters: 911, fromLatitude: 52.28425 })

    const request = new Request('http://localhost/api/routes/directions?from=schloss&to=avz')
    const response = await GET(request)
    const data = await response.json()

    expect(fetchWalkingDirections).toHaveBeenCalledWith(52.2725, 8.044, 52.2833, 8.0233)
    expect(data.distanceMeters).toBe(1850)
    expect(mockUpsert).toHaveBeenCalledOnce()
  })

  it('returns 400 when from/to params are missing', async () => {
    const request = new Request('http://localhost/api/routes/directions?from=schloss')
    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('returns 404 when building not found', async () => {
    const request = new Request('http://localhost/api/routes/directions?from=nonexistent&to=avz')
    const response = await GET(request)
    expect(response.status).toBe(404)
  })
})
