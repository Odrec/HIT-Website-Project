import { describe, it, expect } from 'vitest'
import {
  computeMapCenter,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  FOCUS_MAP_ZOOM,
  buildingsWithCoordinates,
  initialMapView,
} from '@/lib/map-center'
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

describe('initialMapView', () => {
  const schloss = b('11-aula', { latitude: 52.2715, longitude: 8.044231 })
  const fc = b('FC', { latitude: 52.27656, longitude: 8.02186 })
  const route = [
    { latitude: 52.3, longitude: 8.1 },
    { latitude: 52.2, longitude: 8.0 },
  ]

  it('centres on the focused building, zoomed in, ahead of the route', () => {
    expect(initialMapView([schloss, fc], route, 'FC')).toEqual({
      center: [52.27656, 8.02186],
      zoom: FOCUS_MAP_ZOOM,
    })
  })
  it('keeps the overview when nothing is focused', () => {
    const view = initialMapView([schloss, fc], undefined, undefined)
    expect(view.zoom).toBe(DEFAULT_MAP_ZOOM)
    expect(view.center).toEqual(computeMapCenter([schloss, fc]))
  })
  it('keeps the overview when the focused building is unknown or has no position', () => {
    expect(initialMapView([schloss, fc], route, 'gibt-es-nicht')).toEqual({
      center: computeMapCenter([schloss, fc], route),
      zoom: DEFAULT_MAP_ZOOM,
    })
    expect(initialMapView([schloss, b('neu', null)], undefined, 'neu')).toEqual({
      center: computeMapCenter([schloss]),
      zoom: DEFAULT_MAP_ZOOM,
    })
  })
})
