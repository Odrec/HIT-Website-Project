// Route Planning Types

/**
 * Geographic coordinates
 */
export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * A waypoint in a route (building/location)
 */
export interface RouteWaypoint {
  id: string
  name: string
  coordinates: Coordinates
  address?: string
  type: 'building' | 'event' | 'current_location'
  eventId?: string
  eventTitle?: string
  timeStart?: Date
  timeEnd?: Date
}

/**
 * A single leg (segment) of a route between two waypoints
 */
export interface RouteLeg {
  startWaypoint: RouteWaypoint
  endWaypoint: RouteWaypoint
  distance: number // meters
  duration: number // seconds (walking time)
  geometry?: RouteGeometry
  instructions?: RouteInstruction[]
}

/**
 * Polyline geometry for route visualization
 */
export interface RouteGeometry {
  type: 'LineString'
  coordinates: [number, number][] // [lng, lat] pairs
}

/**
 * Turn-by-turn navigation instruction
 */
export interface RouteInstruction {
  type: 'depart' | 'turn_left' | 'turn_right' | 'continue' | 'arrive'
  text: string
  distance: number
  duration: number
}

/**
 * Complete route with multiple legs
 */
export interface Route {
  id: string
  waypoints: RouteWaypoint[]
  legs: RouteLeg[]
  totalDistance: number // meters
  totalDuration: number // seconds
  hasWarnings: boolean
  warnings: RouteWarning[]
}

/**
 * Warning about route issues (tight transitions, etc.)
 */
export interface RouteWarning {
  type: 'insufficient_time' | 'long_distance' | 'accessibility'
  severity: 'info' | 'warning' | 'error'
  message: string
  legIndex: number
  requiredTime: number // seconds needed for walking
  availableTime: number // seconds between events
  eventFromId?: string
  eventToId?: string
}

/**
 * Request for route calculation
 */
export interface RouteRequest {
  waypoints: RouteWaypoint[]
  includeCurrentLocation?: boolean
  optimizeOrder?: boolean
}

/**
 * Request for schedule-based route
 */
export interface ScheduleRouteRequest {
  scheduledEventIds: string[]
  includeCurrentLocation?: boolean
  currentCoordinates?: Coordinates
}

/**
 * Building information for map display
 */
export interface BuildingInfo {
  id: string
  name: string
  shortName?: string
  coordinates: Coordinates
  address: string
  campus: 'schloss' | 'westerberg' | 'caprivi' | 'other'
  hasAccessibility: boolean
  accessibilityNotes?: string
  eventCount?: number
  events?: {
    id: string
    title: string
    timeStart?: Date
    timeEnd?: Date
  }[]
}

/**
 * Campus area definition
 */
export interface CampusArea {
  id: string
  name: string
  center: Coordinates
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

/**
 * Map configuration and state
 */
export interface MapState {
  center: Coordinates
  zoom: number
  selectedBuilding?: string
  selectedRoute?: string
  showAllBuildings: boolean
  showEventLocations: boolean
  showCurrentLocation: boolean
}

/**
 * Walking speed configuration (meters per second)
 */
export const WALKING_SPEEDS = {
  slow: 0.8, // ~2.9 km/h (mobility impaired, crowded)
  normal: 1.2, // ~4.3 km/h (average walking)
  fast: 1.5, // ~5.4 km/h (brisk walking)
} as const

export type WalkingSpeed = keyof typeof WALKING_SPEEDS

/**
 * Travel time margin settings
 */
export interface TravelTimeSettings {
  walkingSpeed: WalkingSpeed
  bufferMinutes: number // extra time before event starts
  minWarningMinutes: number // threshold for showing warning
}

/**
 * Result of travel time analysis between scheduled events
 */
export interface TravelTimeAnalysis {
  eventFromId: string
  eventToId: string
  eventFromTitle: string
  eventToTitle: string
  timeBetweenEvents: number // seconds
  walkingTime: number // seconds
  requiredTime: number // seconds — walkingTime + buffer
  distance: number // meters
  hasSufficientTime: boolean
  timeMargin: number // seconds (can be negative)
  status: 'ok' | 'tight' | 'insufficient'
}

/**
 * Campus area definitions
 */
export const CAMPUS_AREAS: CampusArea[] = [
  {
    id: 'schloss',
    name: 'Schloss Campus',
    center: { latitude: 52.2725, longitude: 8.044 },
    bounds: {
      north: 52.2745,
      south: 52.2705,
      east: 8.048,
      west: 8.04,
    },
  },
  {
    id: 'westerberg',
    name: 'Westerberg Campus',
    center: { latitude: 52.2815, longitude: 8.0245 },
    bounds: {
      north: 52.285,
      south: 52.278,
      east: 8.03,
      west: 8.019,
    },
  },
  {
    id: 'caprivi',
    name: 'Caprivi Campus (Hochschule)',
    center: { latitude: 52.2758, longitude: 8.0152 },
    bounds: {
      north: 52.278,
      south: 52.274,
      east: 8.02,
      west: 8.01,
    },
  },
]

/**
 * Default map center (city center)
 */
export const OSNABRUECK_CENTER: Coordinates = {
  latitude: 52.2799,
  longitude: 8.0472,
}

/**
 * Default travel time settings
 */
export const DEFAULT_TRAVEL_SETTINGS: TravelTimeSettings = {
  walkingSpeed: 'normal',
  bufferMinutes: 5,
  minWarningMinutes: 3,
}
