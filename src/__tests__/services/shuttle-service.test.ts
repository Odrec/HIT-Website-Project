import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindUnique = vi.fn()
const mockFindMany = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockUpsert = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shuttleBus: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    busPosition: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}))

import {
  validateGuideToken,
  updateBusPosition,
  getAllBusPositions,
  createShuttleBus,
  deleteShuttleBus,
  regenerateToken,
  isBusPaused,
  setBusPause,
  resumeBus,
} from '@/services/shuttle-service'

describe('shuttle-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateGuideToken', () => {
    it('returns bus when token is valid', async () => {
      const bus = { id: 'bus1', number: 1, name: 'Bus 1', active: true }
      mockFindUnique.mockResolvedValue(bus)

      const result = await validateGuideToken('valid-token')

      expect(result).toEqual(bus)
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { token: 'valid-token' },
        select: { id: true, number: true, name: true, active: true },
      })
    })

    it('returns null when token is invalid', async () => {
      mockFindUnique.mockResolvedValue(null)
      const result = await validateGuideToken('bad-token')
      expect(result).toBeNull()
    })

    it('returns null when bus is inactive', async () => {
      mockFindUnique.mockResolvedValue({ id: 'bus1', active: false })
      const result = await validateGuideToken('inactive-token')
      expect(result).toBeNull()
    })
  })

  describe('updateBusPosition', () => {
    it('upserts position for a bus', async () => {
      mockUpsert.mockResolvedValue({ id: 'pos1', busId: 'bus1', latitude: 52.27, longitude: 8.04 })

      await updateBusPosition('bus1', {
        latitude: 52.27,
        longitude: 8.04,
        heading: 180,
        speed: 8.3,
      })

      expect(mockUpsert).toHaveBeenCalledWith({
        where: { busId: 'bus1' },
        create: {
          busId: 'bus1',
          latitude: 52.27,
          longitude: 8.04,
          heading: 180,
          speed: 8.3,
        },
        update: {
          latitude: 52.27,
          longitude: 8.04,
          heading: 180,
          speed: 8.3,
        },
      })
    })
  })

  describe('getAllBusPositions', () => {
    it('returns all active buses with positions', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 'bus1',
          number: 1,
          name: 'Bus 1',
          pausedUntil: null,
          pausedIndefinitely: false,
          position: {
            latitude: 52.27,
            longitude: 8.04,
            heading: 180,
            speed: 8.3,
            updatedAt: new Date('2026-11-19T10:30:00Z'),
          },
        },
      ])

      const result = await getAllBusPositions()

      expect(result).toHaveLength(1)
      expect(result[0].number).toBe(1)
      expect(result[0].latitude).toBe(52.27)
      expect(result[0].paused).toBe(false)
      expect(result[0].pausedUntil).toBeNull()
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { active: true },
        include: { position: true },
      })
    })

    it('filters out buses without positions', async () => {
      mockFindMany.mockResolvedValue([{ id: 'bus1', number: 1, name: 'Bus 1', position: null }])

      const result = await getAllBusPositions()
      expect(result).toHaveLength(0)
    })
  })

  describe('createShuttleBus', () => {
    it('creates a new bus with generated token', async () => {
      mockCreate.mockResolvedValue({
        id: 'bus1',
        name: 'Bus 1',
        number: 1,
        token: 'generated-token',
        active: true,
      })

      const result = await createShuttleBus('Bus 1', 1)

      expect(result).toBeDefined()
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Bus 1',
          number: 1,
          token: expect.any(String),
          active: true,
        }),
      })
    })
  })

  describe('deleteShuttleBus', () => {
    it('deletes a bus by id', async () => {
      mockDelete.mockResolvedValue({ id: 'bus1' })
      await deleteShuttleBus('bus1')
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'bus1' } })
    })
  })

  describe('regenerateToken', () => {
    it('updates bus with a new token', async () => {
      mockUpdate.mockResolvedValue({ id: 'bus1', token: 'new-token' })

      const result = await regenerateToken('bus1')

      expect(result).toBeDefined()
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'bus1' },
        data: { token: expect.any(String) },
      })
    })
  })

  describe('isBusPaused', () => {
    it('true when indefinitely paused', () => {
      expect(isBusPaused({ pausedUntil: null, pausedIndefinitely: true })).toBe(true)
    })
    it('true when pausedUntil is in the future', () => {
      expect(
        isBusPaused({ pausedUntil: new Date(Date.now() + 60_000), pausedIndefinitely: false })
      ).toBe(true)
    })
    it('false when pausedUntil is in the past', () => {
      expect(
        isBusPaused({ pausedUntil: new Date(Date.now() - 60_000), pausedIndefinitely: false })
      ).toBe(false)
    })
    it('false when not paused', () => {
      expect(isBusPaused({ pausedUntil: null, pausedIndefinitely: false })).toBe(false)
    })
  })

  describe('setBusPause', () => {
    it('updates pausedUntil + pausedIndefinitely', async () => {
      mockUpdate.mockResolvedValue({ id: 'bus1' })
      const until = new Date('2026-11-19T12:00:00Z')
      await setBusPause('bus1', { until, indefinite: false })
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'bus1' },
        data: { pausedUntil: until, pausedIndefinitely: false },
      })
    })
  })

  describe('resumeBus', () => {
    it('clears the pause', async () => {
      mockUpdate.mockResolvedValue({ id: 'bus1' })
      await resumeBus('bus1')
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'bus1' },
        data: { pausedUntil: null, pausedIndefinitely: false },
      })
    })
  })
})
