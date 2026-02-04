// Route Planning API - Alternative Events Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getSuggestedAlternatives } from '@/services/route-service'
import type { TravelTimeSettings, WalkingSpeed } from '@/types/routes'

/**
 * POST /api/routes/alternatives
 * Get suggested alternative events to avoid travel time conflicts
 * Body:
 * - conflictingEventId: string (required)
 * - scheduledEventIds: string[] (required)
 * - settings?: TravelTimeSettings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conflictingEventId, scheduledEventIds, settings } = body

    if (!conflictingEventId) {
      return NextResponse.json(
        { error: 'conflictingEventId is required' },
        { status: 400 }
      )
    }

    if (!scheduledEventIds || !Array.isArray(scheduledEventIds)) {
      return NextResponse.json(
        { error: 'scheduledEventIds array is required' },
        { status: 400 }
      )
    }

    const travelSettings: TravelTimeSettings = {
      walkingSpeed: (settings?.walkingSpeed || 'normal') as WalkingSpeed,
      bufferMinutes: settings?.bufferMinutes ?? 5,
      minWarningMinutes: settings?.minWarningMinutes ?? 3,
    }

    const alternatives = await getSuggestedAlternatives(
      conflictingEventId,
      scheduledEventIds,
      travelSettings
    )

    return NextResponse.json({
      alternatives,
      conflictingEventId,
    })
  } catch (error) {
    console.error('Alternatives fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to get alternative events' },
      { status: 500 }
    )
  }
}
