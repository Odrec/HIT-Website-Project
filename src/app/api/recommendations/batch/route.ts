// Batch Add API - Add multiple events to schedule at once

import { NextRequest, NextResponse } from 'next/server'
import { recommendationService } from '@/services/recommendation-service'
import type { BatchAddRequest } from '@/types/recommendations'

/**
 * POST /api/recommendations/batch
 * Batch add multiple events, with optional conflict handling
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const batchRequest: BatchAddRequest = {
      eventIds: body.eventIds || [],
      skipConflicts: body.skipConflicts ?? true,
      priorityOverride: body.priorityOverride,
    }

    const scheduledEventIds = body.scheduledEventIds || []

    if (batchRequest.eventIds.length === 0) {
      return NextResponse.json(
        { error: 'No event IDs provided' },
        { status: 400 }
      )
    }

    const result = await recommendationService.batchAddEvents(batchRequest, scheduledEventIds)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error batch adding events:', error)
    return NextResponse.json(
      { error: 'Failed to batch add events' },
      { status: 500 }
    )
  }
}
