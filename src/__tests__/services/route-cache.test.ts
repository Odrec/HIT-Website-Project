import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindUnique = vi.fn()
const mockUpsert = vi.fn()
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    cachedRoute: {
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
      upsert: (...a: unknown[]) => mockUpsert(...a),
    },
  },
}))

const mockFetch = vi.fn()
vi.mock('@/services/google-directions', () => ({
  fetchWalkingDirections: (...a: unknown[]) => mockFetch(...a),
}))

import { getWalkingRoute } from '@/services/route-cache'

// Current positions on the test instance
const CN = { slug: 'CN', coordinates: { latitude: 52.277552, longitude: 8.023436 } }
const SCHLOSS = { slug: '11-aula', coordinates: { latitude: 52.2715, longitude: 8.044231 } }

const toSchloss = {
  distanceMeters: 1900,
  durationSeconds: 1500,
  polyline: 'abc',
  waypoints: [
    [52.27744, 8.02257],
    [52.2715, 8.04423],
  ],
}

const cachedRow = (over: Record<string, unknown> = {}) => ({
  fromBuildingSlug: 'CN',
  toBuildingSlug: '11-aula',
  distanceMeters: 1900,
  durationSeconds: 1500,
  polyline: 'abc',
  waypoints: toSchloss.waypoints,
  fromLatitude: 52.277552,
  fromLongitude: 8.023436,
  toLatitude: 52.2715,
  toLongitude: 8.044231,
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockResolvedValue(toSchloss)
})

describe('getWalkingRoute', () => {
  it('serves a cached route computed from the current positions', async () => {
    mockFindUnique.mockResolvedValue(cachedRow())
    const result = await getWalkingRoute(CN, SCHLOSS)
    expect(result.source).toBe('cache')
    expect(result.route.distanceMeters).toBe(1900)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('recomputes a route cached while a building had different coordinates', async () => {
    // The route stored on 2 Sept 2026, when building 11 still pointed at
    // Westerberg next to building 69: it led visitors to the wrong campus.
    mockFindUnique.mockResolvedValue(
      cachedRow({ distanceMeters: 911, toLatitude: 52.28425, toLongitude: 8.0255 })
    )
    const result = await getWalkingRoute(CN, SCHLOSS)
    expect(result.source).toBe('google')
    expect(result.route.distanceMeters).toBe(1900)
    expect(mockFetch).toHaveBeenCalledWith(52.277552, 8.023436, 52.2715, 8.044231)
    expect(mockUpsert.mock.calls[0][0].update).toMatchObject({
      distanceMeters: 1900,
      fromLatitude: 52.277552,
      fromLongitude: 8.023436,
      toLatitude: 52.2715,
      toLongitude: 8.044231,
    })
  })

  it('recomputes routes cached before positions were recorded', async () => {
    mockFindUnique.mockResolvedValue(
      cachedRow({ fromLatitude: null, fromLongitude: null, toLatitude: null, toLongitude: null })
    )
    expect((await getWalkingRoute(CN, SCHLOSS)).source).toBe('google')
  })

  it('computes and stores a route that is not cached yet', async () => {
    mockFindUnique.mockResolvedValue(null)
    const result = await getWalkingRoute(CN, SCHLOSS)
    expect(result.source).toBe('google')
    expect(mockUpsert.mock.calls[0][0].create).toMatchObject({
      fromBuildingSlug: 'CN',
      toBuildingSlug: '11-aula',
      toLatitude: 52.2715,
      toLongitude: 8.044231,
    })
  })

  it('passes Google failures on to the caller', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockFetch.mockRejectedValue(new Error('OVER_QUERY_LIMIT'))
    await expect(getWalkingRoute(CN, SCHLOSS)).rejects.toThrow('OVER_QUERY_LIMIT')
    expect(mockUpsert).not.toHaveBeenCalled()
  })
})
