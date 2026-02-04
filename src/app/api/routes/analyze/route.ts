// Route Planning API - Travel Time Analysis Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { analyzeTravelTimes } from '@/services/route-service'
import type { TravelTimeSettings, WalkingSpeed } from '@/types/routes'

/**
 * POST /api/routes/analyze
 * Analyze travel times between scheduled events
 * Body:
 * - scheduledEventIds: string[] (required)
 * - settings?: TravelTimeSettings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduledEventIds, settings } = body

    if (!scheduledEventIds || !Array.isArray(scheduledEventIds)) {
      return NextResponse.json(
        { error: 'scheduledEventIds array is required' },
        { status: 400 }
      )
    }

    if (scheduledEventIds.length < 2) {
      return NextResponse.json({
        analyses: [],
        summary: {
          totalTransitions: 0,
          okCount: 0,
          tightCount: 0,
          insufficientCount: 0,
          hasIssues: false,
        },
      })
    }

    const travelSettings: TravelTimeSettings = {
      walkingSpeed: (settings?.walkingSpeed || 'normal') as WalkingSpeed,
      bufferMinutes: settings?.bufferMinutes ?? 5,
      minWarningMinutes: settings?.minWarningMinutes ?? 3,
    }

    const analyses = await analyzeTravelTimes(scheduledEventIds, travelSettings)

    // Calculate summary
    const summary = {
      totalTransitions: analyses.length,
      okCount: analyses.filter((a) => a.status === 'ok').length,
      tightCount: analyses.filter((a) => a.status === 'tight').length,
      insufficientCount: analyses.filter((a) => a.status === 'insufficient').length,
      hasIssues: analyses.some((a) => a.status !== 'ok'),
      totalWalkingTime: analyses.reduce((sum, a) => sum + a.walkingTime, 0),
      totalDistance: analyses.reduce((sum, a) => sum + a.distance, 0),
    }

    return NextResponse.json({
      analyses,
      summary,
    })
  } catch (error) {
    console.error('Travel analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze travel times' },
      { status: 500 }
    )
  }
}
