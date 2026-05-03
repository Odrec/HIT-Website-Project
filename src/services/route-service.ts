// Route Planning Service

import type {
  Coordinates,
  RouteWaypoint,
  RouteLeg,
  Route,
  RouteWarning,
  ScheduleRouteRequest,
  BuildingInfo,
  TravelTimeAnalysis,
  TravelTimeSettings,
  WalkingSpeed,
  RouteGeometry,
} from '@/types/routes'
import { prisma } from '@/lib/db/prisma'
import { fetchWalkingDirections } from '@/services/google-directions'
import { getActiveEditionId } from '@/lib/active-edition'

/**
 * Convert a DB Building record to the BuildingInfo type used by the frontend.
 */
function toBuildingInfo(
  b: {
    id: string
    slug: string
    name: string
    shortName: string | null
    address: string | null
    campus: string | null
    latitude: number | null
    longitude: number | null
    hasAccessibility: boolean
    accessibilityNotes: string | null
  },
  eventCount?: number
): BuildingInfo {
  return {
    id: b.slug,
    name: b.name,
    shortName: b.shortName ?? undefined,
    coordinates: {
      latitude: b.latitude ?? 0,
      longitude: b.longitude ?? 0,
    },
    address: b.address ?? '',
    campus: (b.campus as BuildingInfo['campus']) ?? 'other',
    hasAccessibility: b.hasAccessibility,
    accessibilityNotes: b.accessibilityNotes ?? undefined,
    eventCount,
  }
}

/**
 * Get walking directions between two buildings from cache.
 * Returns null if no cached route exists.
 */
export async function getDirections(
  fromBuildingSlug: string,
  toBuildingSlug: string,
  fromCoords?: Coordinates,
  toCoords?: Coordinates
): Promise<{
  distanceMeters: number
  durationSeconds: number
  waypoints: [number, number][]
} | null> {
  if (fromBuildingSlug === toBuildingSlug) {
    return { distanceMeters: 0, durationSeconds: 0, waypoints: [] }
  }

  const cached = await prisma.cachedRoute.findUnique({
    where: {
      fromBuildingSlug_toBuildingSlug: { fromBuildingSlug, toBuildingSlug },
    },
  })

  if (cached) {
    return {
      distanceMeters: cached.distanceMeters,
      durationSeconds: cached.durationSeconds,
      waypoints: (cached.waypoints as [number, number][]) ?? [],
    }
  }

  // No cache — resolve coordinates from buildings or use provided coords
  const fromBuilding = await findBuilding(fromBuildingSlug)
  const toBuilding = await findBuilding(toBuildingSlug)
  const from = fromBuilding?.coordinates ?? fromCoords
  const to = toBuilding?.coordinates ?? toCoords
  if (!from || !to) return null

  try {
    const result = await fetchWalkingDirections(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    )

    await prisma.cachedRoute.upsert({
      where: {
        fromBuildingSlug_toBuildingSlug: { fromBuildingSlug, toBuildingSlug },
      },
      create: {
        fromBuildingSlug,
        toBuildingSlug,
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
        polyline: result.polyline,
        waypoints: result.waypoints,
      },
      update: {
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
        polyline: result.polyline,
        waypoints: result.waypoints,
      },
    })

    return {
      distanceMeters: result.distanceMeters,
      durationSeconds: result.durationSeconds,
      waypoints: result.waypoints,
    }
  } catch (error) {
    console.error('Google Directions API error, falling back to straight line:', error)
    return null
  }
}

/**
 * Adjust a base walking duration by speed setting.
 * Google returns time for ~5 km/h average walker (our "normal").
 */
export function adjustWalkingTime(
  baseDurationSeconds: number,
  speed: WalkingSpeed = 'normal'
): number {
  const multipliers: Record<WalkingSpeed, number> = {
    slow: 1.5,
    normal: 1.0,
    fast: 0.8,
  }
  return Math.ceil(baseDurationSeconds * multipliers[speed])
}

/**
 * Calculate the straight-line distance between two coordinates using Haversine formula.
 * Used only as a fallback when no cached route is available.
 * @returns Distance in meters
 */
function haversineDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371000 // Earth's radius in meters
  const lat1 = (from.latitude * Math.PI) / 180
  const lat2 = (to.latitude * Math.PI) / 180
  const deltaLat = ((to.latitude - from.latitude) * Math.PI) / 180
  const deltaLon = ((to.longitude - from.longitude) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Find a building by slug or name (queries the database)
 */
export async function findBuilding(slugOrName: string): Promise<BuildingInfo | undefined> {
  const lowerQuery = slugOrName.toLowerCase()

  // Try exact slug match first
  const bySlug = await prisma.building.findUnique({
    where: { slug: lowerQuery },
  })
  if (bySlug) return toBuildingInfo(bySlug)

  // Fallback: search by name
  const all = await prisma.building.findMany()
  const match = all.find(
    (b) =>
      b.name.toLowerCase().includes(lowerQuery) ||
      (b.shortName && b.shortName.toLowerCase() === lowerQuery)
  )
  return match ? toBuildingInfo(match) : undefined
}

/**
 * Find building by partial name match
 */
export async function findBuildingByName(name: string): Promise<BuildingInfo | undefined> {
  const lowerName = name.toLowerCase()
  const all = await prisma.building.findMany()
  const match = all.find(
    (b) =>
      b.name.toLowerCase().includes(lowerName) ||
      (b.shortName && b.shortName.toLowerCase().includes(lowerName))
  )
  return match ? toBuildingInfo(match) : undefined
}

/**
 * Get all buildings with optional event count
 */
export async function getAllBuildings(): Promise<BuildingInfo[]> {
  const buildings = await prisma.building.findMany({
    include: {
      _count: {
        select: { events: true },
      },
    },
    orderBy: [{ campus: 'asc' }, { name: 'asc' }],
  })

  return buildings.map((b) => toBuildingInfo(b, b._count.events))
}

/**
 * Calculate a route leg between two waypoints.
 * Uses cached Google Directions data when available, falls back to straight-line estimate.
 */
async function calculateRouteLeg(
  from: RouteWaypoint,
  to: RouteWaypoint,
  settings: TravelTimeSettings
): Promise<RouteLeg> {
  const directions = await getDirections(from.id, to.id, from.coordinates, to.coordinates)

  let distance: number
  let duration: number
  let geometry: RouteGeometry

  if (directions) {
    distance = directions.distanceMeters
    duration = adjustWalkingTime(directions.durationSeconds, settings.walkingSpeed)
    if (directions.waypoints.length >= 2) {
      geometry = {
        type: 'LineString',
        coordinates: directions.waypoints.map(([lat, lng]) => [lng, lat]),
      }
    } else {
      geometry = {
        type: 'LineString',
        coordinates: [
          [from.coordinates.longitude, from.coordinates.latitude],
          [to.coordinates.longitude, to.coordinates.latitude],
        ],
      }
    }
  } else {
    // Fallback: straight-line distance with 1.4x detour factor
    const straightLine = haversineDistance(from.coordinates, to.coordinates)
    distance = Math.round(straightLine * 1.4)
    const speeds: Record<WalkingSpeed, number> = { slow: 0.8, normal: 1.2, fast: 1.5 }
    duration = Math.ceil(distance / speeds[settings.walkingSpeed])
    geometry = {
      type: 'LineString',
      coordinates: [
        [from.coordinates.longitude, from.coordinates.latitude],
        [to.coordinates.longitude, to.coordinates.latitude],
      ],
    }
  }

  return {
    startWaypoint: from,
    endWaypoint: to,
    distance,
    duration,
    geometry,
    instructions: [
      {
        type: 'depart',
        text: `Starten Sie bei ${from.name}`,
        distance: 0,
        duration: 0,
      },
      {
        type: 'continue',
        text: `Gehen Sie zu ${to.name} (${Math.round(distance)}m)`,
        distance,
        duration,
      },
      {
        type: 'arrive',
        text: `Ankunft bei ${to.name}`,
        distance: 0,
        duration: 0,
      },
    ],
  }
}

/**
 * Check for travel time issues between events
 */
function checkTravelWarnings(legs: RouteLeg[], settings: TravelTimeSettings): RouteWarning[] {
  const warnings: RouteWarning[] = []
  const bufferSeconds = settings.bufferMinutes * 60

  legs.forEach((leg, index) => {
    const from = leg.startWaypoint
    const to = leg.endWaypoint
    let hasInsufficientTime = false

    // Check if both waypoints are events with times
    if (from.timeEnd && to.timeStart) {
      const availableTime = (to.timeStart.getTime() - from.timeEnd.getTime()) / 1000
      const requiredTime = leg.duration + bufferSeconds

      if (availableTime < requiredTime) {
        const severity =
          availableTime < leg.duration ? 'error' : availableTime < requiredTime ? 'warning' : 'info'

        hasInsufficientTime = true
        warnings.push({
          type: 'insufficient_time',
          severity,
          message:
            severity === 'error'
              ? `Nicht genug Zeit um von "${from.eventTitle}" zu "${to.eventTitle}" zu gelangen (${Math.round(
                  leg.duration / 60
                )} Min. Gehzeit, nur ${Math.round(availableTime / 60)} Min. verfügbar)`
              : `Knappe Zeit zwischen "${from.eventTitle}" und "${to.eventTitle}" (${Math.round(
                  (availableTime - leg.duration) / 60
                )} Min. Puffer)`,
          legIndex: index,
          requiredTime: leg.duration,
          availableTime,
          eventFromId: from.eventId,
          eventToId: to.eventId,
        })
      }
    }

    // Check for long distances. If we already raised an insufficient_time
    // warning for this leg, the long-distance note is redundant — the user
    // already sees the gehzeit and knows it's too far for the gap.
    if (leg.distance > 1500 && !hasInsufficientTime) {
      warnings.push({
        type: 'long_distance',
        severity: 'info',
        message: `Lange Strecke: ${Math.round(leg.distance)}m (ca. ${Math.round(
          leg.duration / 60
        )} Min.) zwischen "${from.name}" und "${to.name}"`,
        legIndex: index,
        requiredTime: leg.duration,
        availableTime: 0,
      })
    }
  })

  return warnings
}

/**
 * Calculate a complete route with multiple waypoints
 */
export async function calculateRoute(
  waypoints: RouteWaypoint[],
  settings: TravelTimeSettings = {
    walkingSpeed: 'normal',
    bufferMinutes: 5,
    minWarningMinutes: 3,
  }
): Promise<Route> {
  if (waypoints.length < 2) {
    return {
      id: crypto.randomUUID(),
      waypoints,
      legs: [],
      totalDistance: 0,
      totalDuration: 0,
      hasWarnings: false,
      warnings: [],
    }
  }

  const legs: RouteLeg[] = []
  let totalDistance = 0
  let totalDuration = 0

  for (let i = 0; i < waypoints.length - 1; i++) {
    const leg = await calculateRouteLeg(waypoints[i], waypoints[i + 1], settings)
    legs.push(leg)
    totalDistance += leg.distance
    totalDuration += leg.duration
  }

  const warnings = checkTravelWarnings(legs, settings)

  return {
    id: crypto.randomUUID(),
    waypoints,
    legs,
    totalDistance,
    totalDuration,
    hasWarnings: warnings.length > 0,
    warnings,
  }
}

/**
 * Get coordinates for an event from its building
 */
export async function getEventCoordinates(eventId: string): Promise<Coordinates | null> {
  const editionId = await getActiveEditionId()
  const event = await prisma.event.findFirst({
    where: { id: eventId, editionId, reviewStatus: 'PUBLISHED' },
    include: { building: true },
  })

  if (!event) return null

  if (event.building?.latitude && event.building?.longitude) {
    return {
      latitude: event.building.latitude,
      longitude: event.building.longitude,
    }
  }

  return null
}

/**
 * Resolve coordinates for an event from its building
 */
async function resolveEventCoordinates(event: {
  building?: { slug: string; latitude: number | null; longitude: number | null } | null
}): Promise<{ coordinates: Coordinates; buildingSlug: string } | null> {
  if (event.building?.latitude && event.building?.longitude) {
    return {
      coordinates: { latitude: event.building.latitude, longitude: event.building.longitude },
      buildingSlug: event.building.slug,
    }
  }

  return null
}

/**
 * Calculate route for scheduled events
 */
export async function calculateScheduleRoute(
  request: ScheduleRouteRequest,
  settings: TravelTimeSettings = {
    walkingSpeed: 'normal',
    bufferMinutes: 5,
    minWarningMinutes: 3,
  }
): Promise<Route> {
  const { scheduledEventIds, includeCurrentLocation, currentCoordinates } = request
  const editionId = await getActiveEditionId()

  // Fetch events from database
  const events = await prisma.event.findMany({
    where: {
      id: { in: scheduledEventIds },
      editionId,
      reviewStatus: 'PUBLISHED',
    },
    include: {
      building: true,
    },
    orderBy: {
      timeStart: 'asc',
    },
  })

  // Convert events to waypoints
  const waypoints: RouteWaypoint[] = []

  // Add current location if provided
  if (includeCurrentLocation && currentCoordinates) {
    waypoints.push({
      id: 'current',
      name: 'Aktueller Standort',
      coordinates: currentCoordinates,
      type: 'current_location',
    })
  }

  // Add event waypoints
  for (const event of events) {
    const resolved = await resolveEventCoordinates(event)

    if (resolved) {
      waypoints.push({
        id: resolved.buildingSlug,
        name: event.building?.name ?? 'Unbekannter Ort',
        coordinates: resolved.coordinates,
        type: 'event',
        eventId: event.id,
        eventTitle: event.title,
        timeStart: event.timeStart || undefined,
        timeEnd: event.timeEnd || undefined,
      })
    }
  }

  return calculateRoute(waypoints, settings)
}

/**
 * Analyze travel times between all scheduled events
 */
export async function analyzeTravelTimes(
  scheduledEventIds: string[],
  settings: TravelTimeSettings = {
    walkingSpeed: 'normal',
    bufferMinutes: 5,
    minWarningMinutes: 3,
  }
): Promise<TravelTimeAnalysis[]> {
  const editionId = await getActiveEditionId()
  // Fetch events from database
  const events = await prisma.event.findMany({
    where: {
      id: { in: scheduledEventIds },
      timeStart: { not: null },
      editionId,
      reviewStatus: 'PUBLISHED',
    },
    include: {
      building: true,
    },
    orderBy: {
      timeStart: 'asc',
    },
  })

  // Pre-filter to events that resolve to coordinates. The route does the same
  // implicit filter when building waypoints, so iterating consecutive pairs
  // here gives us one analysis per route leg — without that, a non-routable
  // event sitting between two routable ones (e.g. a timed Infostand) would
  // hide the leg's analysis entirely.
  const resolvedEvents: Array<{
    event: (typeof events)[number]
    resolved: NonNullable<Awaited<ReturnType<typeof resolveEventCoordinates>>>
  }> = []
  for (const event of events) {
    const resolved = await resolveEventCoordinates(event)
    if (resolved) resolvedEvents.push({ event, resolved })
  }

  const analyses: TravelTimeAnalysis[] = []

  for (let i = 0; i < resolvedEvents.length - 1; i++) {
    const { event: eventFrom, resolved: fromResolved } = resolvedEvents[i]
    const { event: eventTo, resolved: toResolved } = resolvedEvents[i + 1]

    if (eventFrom.timeEnd && eventTo.timeStart) {
      // Try cached/API route first, fall back to straight-line estimate
      const cached = await getDirections(
        fromResolved.buildingSlug,
        toResolved.buildingSlug,
        fromResolved.coordinates,
        toResolved.coordinates
      )
      let distance: number
      let walkingTime: number
      if (cached) {
        distance = cached.distanceMeters
        walkingTime = adjustWalkingTime(cached.durationSeconds, settings.walkingSpeed)
      } else {
        distance = Math.round(
          haversineDistance(fromResolved.coordinates, toResolved.coordinates) * 1.4
        )
        walkingTime = adjustWalkingTime(Math.ceil(distance / 1.2), settings.walkingSpeed)
      }

      const timeBetweenEvents = (eventTo.timeStart.getTime() - eventFrom.timeEnd.getTime()) / 1000
      const requiredTime = walkingTime + settings.bufferMinutes * 60

      // Overlapping events: still a scheduling conflict, but the user may want
      // to attend both partially. The minimum time they'll lose from the two
      // events combined is overlap + walkingTime (any earlier-leave / later-
      // arrive split adds up to the same total). Surface that explicitly.
      if (eventTo.timeStart.getTime() < eventFrom.timeEnd.getTime()) {
        const overlapSeconds = (eventFrom.timeEnd.getTime() - eventTo.timeStart.getTime()) / 1000
        analyses.push({
          eventFromId: eventFrom.id,
          eventToId: eventTo.id,
          eventFromTitle: eventFrom.title,
          eventToTitle: eventTo.title,
          timeBetweenEvents: -overlapSeconds,
          walkingTime,
          requiredTime,
          distance,
          hasSufficientTime: false,
          timeMargin: -(overlapSeconds + walkingTime),
          overlapMinutes: Math.ceil(overlapSeconds / 60),
          status: 'conflict',
        })
        continue
      }

      const timeMargin = timeBetweenEvents - requiredTime

      let status: 'ok' | 'tight' | 'insufficient'
      if (timeMargin < 0) {
        status = 'insufficient'
      } else if (timeMargin < settings.minWarningMinutes * 60) {
        status = 'tight'
      } else {
        status = 'ok'
      }

      analyses.push({
        eventFromId: eventFrom.id,
        eventToId: eventTo.id,
        eventFromTitle: eventFrom.title,
        eventToTitle: eventTo.title,
        timeBetweenEvents,
        walkingTime,
        requiredTime,
        distance,
        hasSufficientTime: status === 'ok',
        timeMargin,
        status,
      })
    }
  }

  return analyses
}

/**
 * Get suggested alternative events that avoid travel time conflicts
 */
export async function getSuggestedAlternatives(
  conflictingEventId: string,
  scheduledEventIds: string[],
  settings: TravelTimeSettings = {
    walkingSpeed: 'normal',
    bufferMinutes: 5,
    minWarningMinutes: 3,
  }
): Promise<
  {
    eventId: string
    title: string
    reason: string
    newTravelTime: number
  }[]
> {
  const editionId = await getActiveEditionId()
  // Get the conflicting event
  const conflictingEvent = await prisma.event.findFirst({
    where: { id: conflictingEventId, editionId, reviewStatus: 'PUBLISHED' },
    include: {
      building: true,
      studyPrograms: {
        include: { studyProgram: true },
      },
    },
  })

  if (!conflictingEvent) return []

  // Get all scheduled events
  const scheduledEvents = await prisma.event.findMany({
    where: { id: { in: scheduledEventIds }, editionId, reviewStatus: 'PUBLISHED' },
    include: { building: true },
    orderBy: { timeStart: 'asc' },
  })

  // Find the position of the conflicting event
  const conflictIndex = scheduledEvents.findIndex((e) => e.id === conflictingEventId)
  if (conflictIndex === -1) return []

  // Get the previous event (if any)
  const prevEvent = conflictIndex > 0 ? scheduledEvents[conflictIndex - 1] : null

  // Find similar events (same study programs) at different times/locations
  const studyProgramIds = conflictingEvent.studyPrograms.map((sp) => sp.studyProgramId)

  const alternatives = await prisma.event.findMany({
    where: {
      id: { notIn: scheduledEventIds },
      studyPrograms: {
        some: {
          studyProgramId: { in: studyProgramIds },
        },
      },
      editionId,
      reviewStatus: 'PUBLISHED',
    },
    include: { building: true },
    take: 10,
  })

  const suggestions: {
    eventId: string
    title: string
    reason: string
    newTravelTime: number
  }[] = []

  for (const alt of alternatives) {
    const altResolved = await resolveEventCoordinates(alt)

    if (altResolved && prevEvent) {
      const prevResolved = await resolveEventCoordinates(prevEvent)

      if (prevResolved) {
        const cached = await getDirections(
          prevResolved.buildingSlug,
          altResolved.buildingSlug,
          prevResolved.coordinates,
          altResolved.coordinates
        )
        let walkingTime: number
        if (cached) {
          walkingTime = adjustWalkingTime(cached.durationSeconds, settings.walkingSpeed)
        } else {
          const distance = Math.round(
            haversineDistance(prevResolved.coordinates, altResolved.coordinates) * 1.4
          )
          walkingTime = adjustWalkingTime(Math.ceil(distance / 1.2), settings.walkingSpeed)
        }

        suggestions.push({
          eventId: alt.id,
          title: alt.title,
          reason: `Kürzere Gehzeit (${Math.round(walkingTime / 60)} Min.)`,
          newTravelTime: walkingTime,
        })
      }
    }
  }

  // Sort by travel time
  return suggestions.sort((a, b) => a.newTravelTime - b.newTravelTime).slice(0, 5)
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 1) return 'weniger als 1 Min.'
  if (minutes === 1) return '1 Min.'
  return `${minutes} Min.`
}

/**
 * Format distance in human-readable format
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}
