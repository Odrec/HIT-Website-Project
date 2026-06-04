// src/types/shuttle.ts

export interface ShuttleStop {
  id: string
  name: string
  coordinates: { latitude: number; longitude: number }
  campus: 'schloss' | 'westerberg' | 'caprivi'
  directionsNote: string
}

export interface BusPositionResponse {
  id: string
  number: number
  name: string
  latitude: number
  longitude: number
  heading: number | null
  speed: number | null
  updatedAt: string
  stale: boolean
  paused: boolean
  pausedUntil: string | null
}

export interface BusPositionsResponse {
  buses: BusPositionResponse[]
  stops: ShuttleStop[]
}

export interface BusPositionUpdate {
  latitude: number
  longitude: number
  heading?: number | null
  speed?: number | null
}

export interface ShuttleBusAdmin {
  id: string
  name: string
  number: number
  token: string
  active: boolean
  pausedUntil: string | null
  pausedIndefinitely: boolean
  position: {
    latitude: number
    longitude: number
    heading: number | null
    speed: number | null
    updatedAt: string
  } | null
  createdAt: string
  updatedAt: string
}

export const SHUTTLE_STOPS: ShuttleStop[] = [
  {
    id: 'osnabrueckhalle',
    name: 'OsnabrückHalle / Schloss',
    coordinates: { latitude: 52.2713, longitude: 8.042 },
    campus: 'schloss',
    directionsNote: 'Eine Haltestelle (Seite der OsnabrückHalle)',
  },
  {
    id: 'caprivistrasse',
    name: 'Caprivistraße / Sophie-Charlotte-Str.',
    coordinates: { latitude: 52.278, longitude: 8.024 },
    campus: 'westerberg',
    directionsNote: 'Zwei Haltestellen (eine pro Fahrtrichtung)',
  },
  {
    id: 'nelson-mandela-platz',
    name: 'Nelson-Mandela-Platz',
    coordinates: { latitude: 52.2865, longitude: 8.0231 },
    campus: 'westerberg',
    directionsNote: 'Zwei Haltestellen (eine pro Fahrtrichtung)',
  },
]
