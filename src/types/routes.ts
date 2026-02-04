// Route Planning Types

import type { Location } from './events'

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
  campus: 'schloss' | 'westerberg' | 'haste' | 'caprivi' | 'other'
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
  distance: number // meters
  hasSufficientTime: boolean
  timeMargin: number // seconds (can be negative)
  status: 'ok' | 'tight' | 'insufficient'
}

/**
 * Campus building locations for Osnabrück
 */
export const OSNABRUECK_BUILDINGS: BuildingInfo[] = [
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

/**
 * Campus area definitions
 */
export const CAMPUS_AREAS: CampusArea[] = [
  {
    id: 'schloss',
    name: 'Schloss Campus',
    center: { latitude: 52.2725, longitude: 8.0440 },
    bounds: {
      north: 52.2745,
      south: 52.2705,
      east: 8.0480,
      west: 8.0400,
    },
  },
  {
    id: 'westerberg',
    name: 'Westerberg Campus',
    center: { latitude: 52.2815, longitude: 8.0245 },
    bounds: {
      north: 52.2850,
      south: 52.2780,
      east: 8.0300,
      west: 8.0190,
    },
  },
  {
    id: 'caprivi',
    name: 'Caprivi Campus (Hochschule)',
    center: { latitude: 52.2758, longitude: 8.0152 },
    bounds: {
      north: 52.2780,
      south: 52.2740,
      east: 8.0200,
      west: 8.0100,
    },
  },
  {
    id: 'haste',
    name: 'Haste Campus (Hochschule)',
    center: { latitude: 52.3008, longitude: 7.9847 },
    bounds: {
      north: 52.3030,
      south: 52.2990,
      east: 7.9900,
      west: 7.9800,
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
