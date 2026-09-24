import { describe, it, expect } from 'vitest'
import { computeMapCenter, DEFAULT_MAP_CENTER, buildingsWithCoordinates } from '@/lib/map-center'
import type { BuildingInfo } from '@/types/routes'

const b = (id: string, coords: { latitude: number; longitude: number } | null): BuildingInfo => ({
  id,
  name: id,
  coordinates: coords,
  address: '',
  campus: 'schloss',
  hasAccessibility: false,
})

describe('computeMapCenter', () => {
  it('returns the Osnabrück default when nothing has coordinates', () => {
    expect(computeMapCenter([])).toEqual(DEFAULT_MAP_CENTER)
    expect(computeMapCenter([b('x', null)])).toEqual(DEFAULT_MAP_CENTER)
  })
  it('ignores buildings without coordinates instead of averaging them as 0/0', () => {
    const c = computeMapCenter([
      b('a', { latitude: 52.28, longitude: 8.04 }),
      b('b', { latitude: 52.27, longitude: 8.02 }),
      b('none', null),
    ])
    expect(c[0]).toBeCloseTo(52.275, 5)
    expect(c[1]).toBeCloseTo(8.03, 5)
  })
  it('prefers the route waypoints when a route is given', () => {
    const c = computeMapCenter(
      [b('a', { latitude: 52.28, longitude: 8.04 })],
      [
        { latitude: 52.3, longitude: 8.1 },
        { latitude: 52.2, longitude: 8.0 },
      ]
    )
    expect(c[0]).toBeCloseTo(52.25, 5)
    expect(c[1]).toBeCloseTo(8.05, 5)
  })
})

describe('buildingsWithCoordinates', () => {
  it('drops buildings whose coordinates are null', () => {
    const list = [b('a', { latitude: 1, longitude: 2 }), b('n', null)]
    expect(buildingsWithCoordinates(list).map((x) => x.id)).toEqual(['a'])
  })
})
