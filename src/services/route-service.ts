// Route Planning Service

import type {
  Coordinates,
  RouteWaypoint,
  RouteLeg,
  Route,
  RouteWarning,
  RouteRequest,
  ScheduleRouteRequest,
  BuildingInfo,
  TravelTimeAnalysis,
  TravelTimeSettings,
  WalkingSpeed,
  RouteGeometry,
  WALKING_SPEEDS,
  OSNABRUECK_BUILDINGS,
  DEFAULT_TRAVEL_SETTINGS,
} from '@/types/routes'
import { prisma } from '@/lib/db/prisma'

/**
 * Calculate the distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
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
 * Calculate walking time between two points
 * @returns Walking time in seconds
 */
export function calculateWalkingTime(distance: number, speed: WalkingSpeed = 'normal'): number {
  // Import the constant values directly since we can't use the const object
  const speeds: Record<WalkingSpeed, number> = {
    slow: 0.8,
    normal: 1.2,
    fast: 1.5,
  }
  const speedMps = speeds[speed]
  // Add 20% overhead for non-straight paths, intersections, etc.
  const adjustedDistance = distance * 1.2
  return Math.ceil(adjustedDistance / speedMps)
}

/**
 * Generate a simple line geometry between two points
 */
function generateLineGeometry(from: Coordinates, to: Coordinates): RouteGeometry {
  return {
    type: 'LineString',
    coordinates: [
      [from.longitude, from.latitude],
      [to.longitude, to.latitude],
    ],
  }
}

/**
 * Find a building by ID or name
 */
export function findBuilding(idOrName: string): BuildingInfo | undefined {
  const buildings: BuildingInfo[] = [
    // Schloss Campus (University)
    {
      id: 'schloss',
      name: 'Schloss Osnabrück',
      shortName: 'Schloss',
      coordinates: { latitude: 52.2728, longitude: 8.0432 },
      address: 'Neuer Graben 29, 49074 Osnabrück',
      campus: 'schloss',
      hasAccessibility: true,
    },
    {
      id: 'uos-aula',
      name: 'Aula der Universität',
      shortName: 'Aula',
      coordinates: { latitude: 52.2725, longitude: 8.0438 },
      address: 'Neuer Graben 29, 49074 Osnabrück',
      campus: 'schloss',
      hasAccessibility: true,
    },
    {
      id: 'seminarstrasse',
      name: 'Seminarstraße Gebäude',
      shortName: 'Seminar',
      coordinates: { latitude: 52.2718, longitude: 8.0445 },
      address: 'Seminarstraße 20, 49074 Osnabrück',
      campus: 'schloss',
      hasAccessibility: false,
      accessibilityNotes: 'Historisches Gebäude, eingeschränkter Zugang',
    },
    // Westerberg Campus (University)
    {
      id: 'avz',
      name: 'AVZ (Allgemeines Verfügungszentrum)',
      shortName: 'AVZ',
      coordinates: { latitude: 52.2816, longitude: 8.0234 },
      address: 'Albrechtstraße 28, 49076 Osnabrück',
      campus: 'westerberg',
      hasAccessibility: true,
    },
    {
      id: 'biologie',
      name: 'Biologiegebäude',
      shortName: 'Bio',
      coordinates: { latitude: 52.2802, longitude: 8.0241 },
      address: 'Barbarastraße 11, 49076 Osnabrück',
      campus: 'westerberg',
      hasAccessibility: true,
    },
    {
      id: 'physik',
      name: 'Physikgebäude',
      shortName: 'Physik',
      coordinates: { latitude: 52.2821, longitude: 8.0252 },
      address: 'Barbarastraße 7, 49076 Osnabrück',
      campus: 'westerberg',
      hasAccessibility: true,
    },
    {
      id: 'chemie',
      name: 'Chemiegebäude',
      shortName: 'Chemie',
      coordinates: { latitude: 52.2809, longitude: 8.0263 },
      address: 'Barbarastraße 7, 49076 Osnabrück',
      campus: 'westerberg',
      hasAccessibility: true,
    },
    {
      id: 'mathematik',
      name: 'Mathematik/Informatik',
      shortName: 'Mathe/Info',
      coordinates: { latitude: 52.2827, longitude: 8.0239 },
      address: 'Albrechtstraße 28a, 49076 Osnabrück',
      campus: 'westerberg',
      hasAccessibility: true,
    },
    {
      id: 'eihu',
      name: 'EIHU (Erweiterungsbau Informatik)',
      shortName: 'EIHU',
      coordinates: { latitude: 52.2831, longitude: 8.0227 },
      address: 'Wachsbleiche 27, 49076 Osnabrück',
      campus: 'westerberg',
      hasAccessibility: true,
    },
    // Hochschule Caprivi Campus
    {
      id: 'caprivi-a',
      name: 'Caprivistraße Gebäude A',
      shortName: 'CN-A',
      coordinates: { latitude: 52.2756, longitude: 8.0148 },
      address: 'Caprivistraße 30a, 49076 Osnabrück',
      campus: 'caprivi',
      hasAccessibility: true,
    },
    {
      id: 'caprivi-b',
      name: 'Caprivistraße Gebäude B',
      shortName: 'CN-B',
      coordinates: { latitude: 52.2761, longitude: 8.0155 },
      address: 'Caprivistraße 30b, 49076 Osnabrück',
      campus: 'caprivi',
      hasAccessibility: true,
    },
    {
      id: 'caprivi-c',
      name: 'Caprivistraße Gebäude C',
      shortName: 'CN-C',
      coordinates: { latitude: 52.2766, longitude: 8.0162 },
      address: 'Caprivistraße 30c, 49076 Osnabrück',
      campus: 'caprivi',
      hasAccessibility: true,
    },
    {
      id: 'caprivi-mensa',
      name: 'Mensa Caprivi',
      shortName: 'Mensa CN',
      coordinates: { latitude: 52.2751, longitude: 8.0141 },
      address: 'Caprivistraße 30, 49076 Osnabrück',
      campus: 'caprivi',
      hasAccessibility: true,
    },
    // Hochschule Haste Campus
    {
      id: 'haste-a',
      name: 'Haste Gebäude A',
      shortName: 'HA-A',
      coordinates: { latitude: 52.3006, longitude: 7.9843 },
      address: 'Am Krümpel 31, 49090 Osnabrück',
      campus: 'haste',
      hasAccessibility: true,
    },
    {
      id: 'haste-b',
      name: 'Haste Gebäude B',
      shortName: 'HA-B',
      coordinates: { latitude: 52.3011, longitude: 7.9851 },
      address: 'Am Krümpel 31, 49090 Osnabrück',
      campus: 'haste',
      hasAccessibility: true,
    },
  ]

  const lowerId = idOrName.toLowerCase()
  return buildings.find(
    (b) =>
      b.id.toLowerCase() === lowerId ||
      b.name.toLowerCase().includes(lowerId) ||
      (b.shortName && b.shortName.toLowerCase() === lowerId)
  )
}

/**
 * Find building by partial name match
 */
export function findBuildingByName(name: string): BuildingInfo | undefined {
  const buildings: BuildingInfo[] = [
    {
      id: 'schloss',
      name: 'Schloss Osnabrück',
      shortName: 'Schloss',
      coordinates: { latitude: 52.2728, longitude: 8.0432 },
      address: 'Neuer Graben 29, 49074 Osnabrück',
      campus: 'schloss',
      hasAccessibility: true,
    },
    {
      id: 'avz',
      name: 'AVZ (Allgemeines Verfügungszentrum)',
      shortName: 'AVZ',
      coordinates: { latitude: 52.2816, longitude: 8.0234 },
      address: 'Albrechtstraße 28, 49076 Osnabrück',
      campus: 'westerberg',
      hasAccessibility: true,
    },
    {
      id: 'caprivi-a',
      name: 'Caprivistraße Gebäude A',
      shortName: 'CN-A',
      coordinates: { latitude: 52.2756, longitude: 8.0148 },
      address: 'Caprivistraße 30a, 49076 Osnabrück',
      campus: 'caprivi',
      hasAccessibility: true,
    },
  ]
  const lowerName = name.toLowerCase()
  return buildings.find(
    (b) =>
      b.name.toLowerCase().includes(lowerName) ||
      (b.shortName && b.shortName.toLowerCase().includes(lowerName))
  )
}

/**
 * Get all buildings with optional event count
 */
export async function getAllBuildings(): Promise<BuildingInfo[]> {
  const buildings: BuildingInfo[] = [
    // Schloss Campus (University)
    {
      id: 'schloss',
      name: 'Schloss Osnabrück',
      shortName: 'Schloss',
      coordinates: { latitude: 52.2728, longitude: 8.0432 },
      address: 'Neuer Graben 29, 49074 Osnabrück',
      campus: 'schloss',
      hasAccessibility: true,
    },
    {
      id: 'uos-aula',
      name: 'Aula der Universität',
      shortName: 'Aula',
      coordinates: { latitude: 52.2725, longitude: 8.0438 },
      address: 'Neuer Graben 29, 49074 Osnabrück',
      campus: 'schloss',
      hasAccessibility: true,
    },
    {
      id: 'seminarstrasse',
      name: 'Seminarstraße Gebäude',
      shortName: 'Seminar',
      coordinates: { latitude: 52.2718, longitude: 8.0445 },
      address: 'Seminarstraße 20, 49074 Osnabrück',
      campus: 'schloss',
      hasAccessibility: false,
      accessibilityNotes: 'Historisches Gebäude, eingeschränkter Zugang',
    },
    // Westerberg Campus (University)
    {
      id: 'avz',
      name: 'AVZ (Allgemeines Verfügungszentrum)',
      shortName: 'AVZ',
      coordinates: { latitude: 52.2816, longitude: 8.0234 },
      address: 'Albrechtstraße 28, 49076 Osnabrück',
      campus: 'westerberg',
      hasAccessibility: true,
    },
    {
      id: 'biologie',
      name: 'Biologiegebäude',
      shortName: 'Bio',
      coordinates: { latitude: 52.2802, longitude: 8.0241 },
      address: 'Barbarastraße 11, 49076 Osnabrück',
      campus: 'westerberg',
      hasAccessibility: true,
    },
    {
      id: 'physik',
      name: 'Physikgebäude',
      shortName: 'Physik',
      coordinates: { latitude: 52.2821, longitude: 8.0252 },
      address: 'Barbarastraße 7, 49076 Osnabrück',
      campus: 'westerberg',
      hasAccessibility: true,
    },
    {
      id: 'chemie',
      name: 'Chemiegebäude',
      shortName: 'Chemie',
      coordinates: { latitude: 52.2809, longitude: 8.0263 },
      address: 'Barbarastraße 7, 49076 Osnabrück',
      campus: 'westerberg',
      hasAccessibility: true,
    },
    {
      id: 'mathematik',
      name: 'Mathematik/Informatik',
      shortName: 'Mathe/Info',
      coordinates: { latitude: 52.2827, longitude: 8.0239 },
      address: 'Albrechtstraße 28a, 49076 Osnabrück',
      campus: 'westerberg',
      hasAccessibility: true,
    },
    {
      id: 'eihu',
      name: 'EIHU (Erweiterungsbau Informatik)',
      shortName: 'EIHU',
      coordinates: { latitude: 52.2831, longitude: 8.0227 },
      address: 'Wachsbleiche 27, 49076 Osnabrück',
      campus: 'westerberg',
      hasAccessibility: true,
    },
    // Hochschule Caprivi Campus
    {
      id: 'caprivi-a',
      name: 'Caprivistraße Gebäude A',
      shortName: 'CN-A',
      coordinates: { latitude: 52.2756, longitude: 8.0148 },
      address: 'Caprivistraße 30a, 49076 Osnabrück',
      campus: 'caprivi',
      hasAccessibility: true,
    },
    {
      id: 'caprivi-b',
      name: 'Caprivistraße Gebäude B',
      shortName: 'CN-B',
      coordinates: { latitude: 52.2761, longitude: 8.0155 },
      address: 'Caprivistraße 30b, 49076 Osnabrück',
      campus: 'caprivi',
      hasAccessibility: true,
    },
    {
      id: 'caprivi-c',
      name: 'Caprivistraße Gebäude C',
      shortName: 'CN-C',
      coordinates: { latitude: 52.2766, longitude: 8.0162 },
      address: 'Caprivistraße 30c, 49076 Osnabrück',
      campus: 'caprivi',
      hasAccessibility: true,
    },
    {
      id: 'caprivi-mensa',
      name: 'Mensa Caprivi',
      shortName: 'Mensa CN',
      coordinates: { latitude: 52.2751, longitude: 8.0141 },
      address: 'Caprivistraße 30, 49076 Osnabrück',
      campus: 'caprivi',
      hasAccessibility: true,
    },
    // Hochschule Haste Campus
    {
      id: 'haste-a',
      name: 'Haste Gebäude A',
      shortName: 'HA-A',
      coordinates: { latitude: 52.3006, longitude: 7.9843 },
      address: 'Am Krümpel 31, 49090 Osnabrück',
      campus: 'haste',
      hasAccessibility: true,
    },
    {
      id: 'haste-b',
      name: 'Haste Gebäude B',
      shortName: 'HA-B',
      coordinates: { latitude: 52.3011, longitude: 7.9851 },
      address: 'Am Krümpel 31, 49090 Osnabrück',
      campus: 'haste',
      hasAccessibility: true,
    },
  ]

  // Get event counts from locations
  const locations = await prisma.location.findMany({
    include: {
      _count: {
        select: { events: true },
      },
    },
  })

  // Match buildings with database locations
  return buildings.map((building) => {
    const dbLocation = locations.find(
      (loc) =>
        loc.buildingName.toLowerCase().includes(building.name.toLowerCase()) ||
        (building.shortName &&
          loc.buildingName.toLowerCase().includes(building.shortName.toLowerCase()))
    )
    return {
      ...building,
      eventCount: dbLocation?._count?.events || 0,
    }
  })
}

/**
 * Calculate a route leg between two waypoints
 */
function calculateRouteLeg(
  from: RouteWaypoint,
  to: RouteWaypoint,
  settings: TravelTimeSettings
): RouteLeg {
  const distance = calculateDistance(from.coordinates, to.coordinates)
  const duration = calculateWalkingTime(distance, settings.walkingSpeed)

  return {
    startWaypoint: from,
    endWaypoint: to,
    distance,
    duration,
    geometry: generateLineGeometry(from.coordinates, to.coordinates),
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
  const warningThreshold = settings.minWarningMinutes * 60

  legs.forEach((leg, index) => {
    const from = leg.startWaypoint
    const to = leg.endWaypoint

    // Check if both waypoints are events with times
    if (from.timeEnd && to.timeStart) {
      const availableTime = (to.timeStart.getTime() - from.timeEnd.getTime()) / 1000
      const requiredTime = leg.duration + bufferSeconds

      if (availableTime < requiredTime) {
        const severity =
          availableTime < leg.duration ? 'error' : availableTime < requiredTime ? 'warning' : 'info'

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

    // Check for long distances
    if (leg.distance > 1500) {
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
export function calculateRoute(
  waypoints: RouteWaypoint[],
  settings: TravelTimeSettings = {
    walkingSpeed: 'normal',
    bufferMinutes: 5,
    minWarningMinutes: 3,
  }
): Route {
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
    const leg = calculateRouteLeg(waypoints[i], waypoints[i + 1], settings)
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
 * Get coordinates for an event from its location
 */
export async function getEventCoordinates(eventId: string): Promise<Coordinates | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { location: true },
  })

  if (!event) return null

  // Check if location has coordinates
  if (event.location?.latitude && event.location?.longitude) {
    return {
      latitude: event.location.latitude,
      longitude: event.location.longitude,
    }
  }

  // Try to match by building name
  if (event.location?.buildingName) {
    const building = findBuildingByName(event.location.buildingName)
    if (building) {
      return building.coordinates
    }
  }

  // Fallback: use meeting point or location details
  // This would need more sophisticated parsing in production
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

  // Fetch events from database
  const events = await prisma.event.findMany({
    where: {
      id: { in: scheduledEventIds },
    },
    include: {
      location: true,
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
    let coordinates: Coordinates | null = null

    if (event.location?.latitude && event.location?.longitude) {
      coordinates = {
        latitude: event.location.latitude,
        longitude: event.location.longitude,
      }
    } else if (event.location?.buildingName) {
      const building = findBuildingByName(event.location.buildingName)
      if (building) {
        coordinates = building.coordinates
      }
    }

    if (coordinates) {
      waypoints.push({
        id: event.id,
        name: event.location?.buildingName || 'Unbekannter Ort',
        coordinates,
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
  // Fetch events from database
  const events = await prisma.event.findMany({
    where: {
      id: { in: scheduledEventIds },
      timeStart: { not: null },
    },
    include: {
      location: true,
    },
    orderBy: {
      timeStart: 'asc',
    },
  })

  const analyses: TravelTimeAnalysis[] = []

  for (let i = 0; i < events.length - 1; i++) {
    const eventFrom = events[i]
    const eventTo = events[i + 1]

    // Get coordinates for both events
    let fromCoords: Coordinates | null = null
    let toCoords: Coordinates | null = null

    if (eventFrom.location?.latitude && eventFrom.location?.longitude) {
      fromCoords = {
        latitude: eventFrom.location.latitude,
        longitude: eventFrom.location.longitude,
      }
    } else if (eventFrom.location?.buildingName) {
      const building = findBuildingByName(eventFrom.location.buildingName)
      if (building) fromCoords = building.coordinates
    }

    if (eventTo.location?.latitude && eventTo.location?.longitude) {
      toCoords = {
        latitude: eventTo.location.latitude,
        longitude: eventTo.location.longitude,
      }
    } else if (eventTo.location?.buildingName) {
      const building = findBuildingByName(eventTo.location.buildingName)
      if (building) toCoords = building.coordinates
    }

    // Calculate times if we have both coordinates
    if (fromCoords && toCoords && eventFrom.timeEnd && eventTo.timeStart) {
      const distance = calculateDistance(fromCoords, toCoords)
      const walkingTime = calculateWalkingTime(distance, settings.walkingSpeed)
      const timeBetweenEvents = (eventTo.timeStart.getTime() - eventFrom.timeEnd.getTime()) / 1000
      const timeMargin = timeBetweenEvents - walkingTime - settings.bufferMinutes * 60

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
  // Get the conflicting event
  const conflictingEvent = await prisma.event.findUnique({
    where: { id: conflictingEventId },
    include: {
      location: true,
      studyPrograms: {
        include: { studyProgram: true },
      },
    },
  })

  if (!conflictingEvent) return []

  // Get all scheduled events
  const scheduledEvents = await prisma.event.findMany({
    where: { id: { in: scheduledEventIds } },
    include: { location: true },
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
    },
    include: { location: true },
    take: 10,
  })

  const suggestions: {
    eventId: string
    title: string
    reason: string
    newTravelTime: number
  }[] = []

  for (const alt of alternatives) {
    let altCoords: Coordinates | null = null
    if (alt.location?.latitude && alt.location?.longitude) {
      altCoords = {
        latitude: alt.location.latitude,
        longitude: alt.location.longitude,
      }
    } else if (alt.location?.buildingName) {
      const building = findBuildingByName(alt.location.buildingName)
      if (building) altCoords = building.coordinates
    }

    if (altCoords && prevEvent?.location) {
      let prevCoords: Coordinates | null = null
      if (prevEvent.location.latitude && prevEvent.location.longitude) {
        prevCoords = {
          latitude: prevEvent.location.latitude,
          longitude: prevEvent.location.longitude,
        }
      } else if (prevEvent.location.buildingName) {
        const building = findBuildingByName(prevEvent.location.buildingName)
        if (building) prevCoords = building.coordinates
      }

      if (prevCoords) {
        const distance = calculateDistance(prevCoords, altCoords)
        const walkingTime = calculateWalkingTime(distance, settings.walkingSpeed)

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
