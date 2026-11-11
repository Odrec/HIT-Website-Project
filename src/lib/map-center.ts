// Pure helpers for the Lageplan viewport. Buildings without coordinates must
// never take part in centre/bounds maths — averaging them as 0/0 once put the
// map in the French Alps.

import type { BuildingInfo, Coordinates } from '@/types/routes'

/** Schloss Osnabrück – the sensible default when nothing else is known. */
export const DEFAULT_MAP_CENTER: [number, number] = [52.2799, 8.0472]

export type LocatedBuilding = BuildingInfo & { coordinates: Coordinates }

export function buildingsWithCoordinates(buildings: BuildingInfo[]): LocatedBuilding[] {
  return buildings.filter((b): b is LocatedBuilding => b.coordinates != null)
}

function average(points: Coordinates[]): [number, number] {
  const lat = points.reduce((s, p) => s + p.latitude, 0) / points.length
  const lng = points.reduce((s, p) => s + p.longitude, 0) / points.length
  return [lat, lng]
}

export function computeMapCenter(
  buildings: BuildingInfo[],
  routePoints?: Coordinates[]
): [number, number] {
  if (routePoints && routePoints.length > 0) return average(routePoints)
  const located = buildingsWithCoordinates(buildings)
  if (located.length > 0) return average(located.map((b) => b.coordinates))
  return DEFAULT_MAP_CENTER
}

export const DEFAULT_MAP_ZOOM = 14
/** Close enough to tell neighbouring buildings (e.g. on the Schloss campus) apart. */
export const FOCUS_MAP_ZOOM = 17

/**
 * Viewport the Lageplan opens with. A focused building (e.g. arriving from an
 * event's "Auf dem Lageplan anzeigen") wins over the route and the overview;
 * an unknown slug or a building without a position falls back to the overview.
 */
export function initialMapView(
  buildings: BuildingInfo[],
  routePoints: Coordinates[] | undefined,
  focusBuildingId: string | undefined
): { center: [number, number]; zoom: number } {
  const focus = focusBuildingId
    ? buildingsWithCoordinates(buildings).find((b) => b.id === focusBuildingId)
    : undefined
  if (focus) {
    return {
      center: [focus.coordinates.latitude, focus.coordinates.longitude],
      zoom: FOCUS_MAP_ZOOM,
    }
  }
  return { center: computeMapCenter(buildings, routePoints), zoom: DEFAULT_MAP_ZOOM }
}
