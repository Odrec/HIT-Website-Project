// src/types/shuttle.ts

/** Shuttle-bus stop as drawn on the Lageplan (stored in `shuttle_stops`, admin-editable). */
export interface ShuttleStop {
  id: string
  name: string
  coordinates: { latitude: number; longitude: number }
  directionsNote: string | null
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
