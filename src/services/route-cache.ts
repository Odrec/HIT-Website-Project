import { prisma } from '@/lib/db/prisma'
import { fetchWalkingDirections } from '@/services/google-directions'
import type { Coordinates } from '@/types/routes'

/**
 * Walking routes between buildings, cached in `cached_routes`.
 *
 * A cached row is only used while both buildings still sit where they were
 * when the route was computed. Before this check the cache was keyed by slug
 * alone, so routes computed while building 11 (Schloss) had coordinates at
 * Westerberg kept leading visitors to building 69 after the position was
 * corrected.
 */

export interface RouteEndpoint {
  slug: string
  coordinates: Coordinates
}

export interface WalkingRoute {
  distanceMeters: number
  durationSeconds: number
  waypoints: [number, number][]
}

interface CachedRouteRow {
  distanceMeters: number
  durationSeconds: number
  waypoints: unknown
  fromLatitude: number | null
  fromLongitude: number | null
  toLatitude: number | null
  toLongitude: number | null
}

function isFresh(row: CachedRouteRow, from: RouteEndpoint, to: RouteEndpoint): boolean {
  return (
    row.fromLatitude === from.coordinates.latitude &&
    row.fromLongitude === from.coordinates.longitude &&
    row.toLatitude === to.coordinates.latitude &&
    row.toLongitude === to.coordinates.longitude
  )
}

/**
 * Route between two buildings: from the cache when it is still valid for the
 * buildings' current positions, otherwise from Google (and cached). Google
 * errors are passed on; callers decide how to degrade.
 */
export async function getWalkingRoute(
  from: RouteEndpoint,
  to: RouteEndpoint
): Promise<{ route: WalkingRoute; source: 'cache' | 'google' }> {
  const key = { fromBuildingSlug: from.slug, toBuildingSlug: to.slug }
  const cached = await prisma.cachedRoute.findUnique({
    where: { fromBuildingSlug_toBuildingSlug: key },
  })

  if (cached && isFresh(cached, from, to)) {
    return {
      route: {
        distanceMeters: cached.distanceMeters,
        durationSeconds: cached.durationSeconds,
        waypoints: (cached.waypoints as [number, number][]) ?? [],
      },
      source: 'cache',
    }
  }

  const result = await fetchWalkingDirections(
    from.coordinates.latitude,
    from.coordinates.longitude,
    to.coordinates.latitude,
    to.coordinates.longitude
  )

  const data = {
    distanceMeters: result.distanceMeters,
    durationSeconds: result.durationSeconds,
    polyline: result.polyline,
    waypoints: result.waypoints,
    fromLatitude: from.coordinates.latitude,
    fromLongitude: from.coordinates.longitude,
    toLatitude: to.coordinates.latitude,
    toLongitude: to.coordinates.longitude,
  }
  await prisma.cachedRoute.upsert({
    where: { fromBuildingSlug_toBuildingSlug: key },
    create: { ...key, ...data },
    update: data,
  })

  return {
    route: {
      distanceMeters: result.distanceMeters,
      durationSeconds: result.durationSeconds,
      waypoints: result.waypoints,
    },
    source: 'google',
  }
}
