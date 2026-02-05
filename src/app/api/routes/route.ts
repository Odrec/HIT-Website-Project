// Route Planning API - Main Route Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { calculateRoute, calculateScheduleRoute, findBuilding } from '@/services/route-service'
import type { RouteWaypoint, Coordinates, TravelTimeSettings, WalkingSpeed } from '@/types/routes'

/**
 * GET /api/routes
 * Calculate route between waypoints (simple version)
 * Query params:
 * - from: building ID or name
 * - to: building ID or name
 * - walkingSpeed: slow | normal | fast (default: normal)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const walkingSpeed = (searchParams.get('walkingSpeed') || 'normal') as WalkingSpeed

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Both "from" and "to" parameters are required' },
        { status: 400 }
      )
    }

    const fromBuilding = findBuilding(from)
    const toBuilding = findBuilding(to)

    if (!fromBuilding) {
      return NextResponse.json({ error: `Building not found: ${from}` }, { status: 404 })
    }

    if (!toBuilding) {
      return NextResponse.json({ error: `Building not found: ${to}` }, { status: 404 })
    }

    const waypoints: RouteWaypoint[] = [
      {
        id: fromBuilding.id,
        name: fromBuilding.name,
        coordinates: fromBuilding.coordinates,
        type: 'building',
        address: fromBuilding.address,
      },
      {
        id: toBuilding.id,
        name: toBuilding.name,
        coordinates: toBuilding.coordinates,
        type: 'building',
        address: toBuilding.address,
      },
    ]

    const settings: TravelTimeSettings = {
      walkingSpeed,
      bufferMinutes: 5,
      minWarningMinutes: 3,
    }

    const route = calculateRoute(waypoints, settings)

    return NextResponse.json(route)
  } catch (error) {
    console.error('Route calculation error:', error)
    return NextResponse.json({ error: 'Failed to calculate route' }, { status: 500 })
  }
}

/**
 * POST /api/routes
 * Calculate route with full waypoints or scheduled events
 * Body:
 * - waypoints?: RouteWaypoint[] (direct waypoints)
 * - scheduledEventIds?: string[] (events to route between)
 * - includeCurrentLocation?: boolean
 * - currentCoordinates?: Coordinates
 * - settings?: TravelTimeSettings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { waypoints, scheduledEventIds, includeCurrentLocation, currentCoordinates, settings } =
      body

    const travelSettings: TravelTimeSettings = {
      walkingSpeed: settings?.walkingSpeed || 'normal',
      bufferMinutes: settings?.bufferMinutes ?? 5,
      minWarningMinutes: settings?.minWarningMinutes ?? 3,
    }

    // If scheduled event IDs provided, use schedule route calculation
    if (scheduledEventIds && Array.isArray(scheduledEventIds) && scheduledEventIds.length > 0) {
      const route = await calculateScheduleRoute(
        {
          scheduledEventIds,
          includeCurrentLocation,
          currentCoordinates,
        },
        travelSettings
      )
      return NextResponse.json(route)
    }

    // If waypoints provided, calculate direct route
    if (waypoints && Array.isArray(waypoints) && waypoints.length >= 2) {
      const route = calculateRoute(waypoints, travelSettings)
      return NextResponse.json(route)
    }

    return NextResponse.json(
      { error: 'Either "waypoints" (array of 2+) or "scheduledEventIds" (array) is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Route calculation error:', error)
    return NextResponse.json({ error: 'Failed to calculate route' }, { status: 500 })
  }
}
