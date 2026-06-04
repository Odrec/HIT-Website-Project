import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/services/shuttle-service', () => ({
  validateGuideToken: vi.fn(),
  updateBusPosition: vi.fn(),
  getAllBusPositions: vi.fn(),
}))

import { GET, POST } from '@/app/api/bus-positions/route'
import {
  validateGuideToken,
  updateBusPosition,
  getAllBusPositions,
} from '@/services/shuttle-service'

const mockValidateGuideToken = vi.mocked(validateGuideToken)
const mockUpdateBusPosition = vi.mocked(updateBusPosition)
const mockGetAllBusPositions = vi.mocked(getAllBusPositions)

describe('Bus Positions API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/bus-positions', () => {
    it('returns bus positions and stops', async () => {
      mockGetAllBusPositions.mockResolvedValue([
        {
          id: 'bus1',
          number: 1,
          name: 'Bus 1',
          latitude: 52.27,
          longitude: 8.04,
          heading: null,
          speed: null,
          updatedAt: '2026-11-19T10:30:00Z',
          stale: false,
          paused: false,
          pausedUntil: null,
        },
      ])

      const request = new NextRequest('http://localhost/api/bus-positions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.buses).toHaveLength(1)
      expect(data.stops).toHaveLength(3)
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=5')
    })
  })

  describe('POST /api/bus-positions', () => {
    it('updates position with valid token', async () => {
      mockValidateGuideToken.mockResolvedValue({
        id: 'bus1',
        number: 1,
        name: 'Bus 1',
        active: true,
      })
      mockUpdateBusPosition.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost/api/bus-positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ latitude: 52.27, longitude: 8.04 }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
      expect(mockUpdateBusPosition).toHaveBeenCalledWith('bus1', {
        latitude: 52.27,
        longitude: 8.04,
        heading: undefined,
        speed: undefined,
      })
    })

    it('returns 401 without auth header', async () => {
      const request = new NextRequest('http://localhost/api/bus-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: 52.27, longitude: 8.04 }),
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('returns 401 with invalid token', async () => {
      mockValidateGuideToken.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/bus-positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer bad-token',
        },
        body: JSON.stringify({ latitude: 52.27, longitude: 8.04 }),
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('returns 400 with missing coordinates', async () => {
      mockValidateGuideToken.mockResolvedValue({
        id: 'bus1',
        number: 1,
        name: 'Bus 1',
        active: true,
      })

      const request = new NextRequest('http://localhost/api/bus-positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ latitude: 52.27 }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })
})
