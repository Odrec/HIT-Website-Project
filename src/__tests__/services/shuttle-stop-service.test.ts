import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindMany = vi.fn()
const mockAggregate = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shuttleStop: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      aggregate: (...args: unknown[]) => mockAggregate(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}))

import {
  getShuttleStops,
  createShuttleStop,
  updateShuttleStop,
  deleteShuttleStop,
} from '@/services/shuttle-stop-service'

const row = {
  id: 'osnabrueckhalle',
  name: 'OsnabrückHalle / Schloss',
  latitude: 52.272345,
  longitude: 8.044123,
  directionsNote: 'Eine Haltestelle',
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}
const mapped = {
  id: 'osnabrueckhalle',
  name: 'OsnabrückHalle / Schloss',
  coordinates: { latitude: 52.272345, longitude: 8.044123 },
  directionsNote: 'Eine Haltestelle',
}

beforeEach(() => vi.clearAllMocks())

describe('shuttle-stop-service', () => {
  it('lists stops in their configured order, shaped for the map', async () => {
    mockFindMany.mockResolvedValue([row])
    expect(await getShuttleStops()).toEqual([mapped])
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
  })

  it('appends a new stop after the existing ones', async () => {
    mockAggregate.mockResolvedValue({ _max: { sortOrder: 3 } })
    mockCreate.mockResolvedValue(row)
    const input = { name: row.name, latitude: 52.272345, longitude: 8.044123, directionsNote: null }
    expect(await createShuttleStop(input)).toEqual(mapped)
    expect(mockCreate).toHaveBeenCalledWith({ data: { ...input, sortOrder: 4 } })
  })

  it('returns null when updating a stop that no longer exists', async () => {
    mockUpdate.mockRejectedValue(Object.assign(new Error('not found'), { code: 'P2025' }))
    const input = { name: 'X', latitude: 52.27, longitude: 8.04, directionsNote: null }
    expect(await updateShuttleStop('gone', input)).toBeNull()
  })

  it('reports whether a delete removed anything', async () => {
    mockDelete.mockResolvedValueOnce(row)
    expect(await deleteShuttleStop('osnabrueckhalle')).toBe(true)
    mockDelete.mockRejectedValueOnce(Object.assign(new Error('not found'), { code: 'P2025' }))
    expect(await deleteShuttleStop('gone')).toBe(false)
  })
})
