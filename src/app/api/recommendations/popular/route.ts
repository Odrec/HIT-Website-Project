// Popular Events API - Get trending and popular events

import { NextRequest, NextResponse } from 'next/server'
import { recommendationService } from '@/services/recommendation-service'

/**
 * GET /api/recommendations/popular
 * Get most popular events based on views and schedule adds
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const popularEvents = await recommendationService.getPopularEvents(limit)

    return NextResponse.json({
      events: popularEvents,
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error getting popular events:', error)
    return NextResponse.json({ error: 'Failed to get popular events' }, { status: 500 })
  }
}

/**
 * POST /api/recommendations/popular
 * Track event popularity (view or schedule add)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, action } = body

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    if (action === 'view') {
      recommendationService.trackEventView(eventId)
    } else if (action === 'schedule') {
      recommendationService.trackEventScheduled(eventId)
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "view" or "schedule"' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking event popularity:', error)
    return NextResponse.json({ error: 'Failed to track event popularity' }, { status: 500 })
  }
}
