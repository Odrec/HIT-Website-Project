// Time Slots API - Find events that fit in available time slots

import { NextRequest, NextResponse } from 'next/server'
import { recommendationService } from '@/services/recommendation-service'
import type { TimeSlot } from '@/types/recommendations'

/**
 * POST /api/recommendations/time-slots
 * Get events that fit within specified time slots
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const timeSlots: TimeSlot[] = (body.timeSlots || []).map((slot: { start: string; end: string; durationMinutes?: number }) => ({
      start: new Date(slot.start),
      end: new Date(slot.end),
      durationMinutes: slot.durationMinutes || 
        Math.floor((new Date(slot.end).getTime() - new Date(slot.start).getTime()) / (1000 * 60)),
    }))

    const excludeEventIds = body.excludeEventIds || []
    const limit = body.limit || 10

    if (timeSlots.length === 0) {
      return NextResponse.json(
        { error: 'At least one time slot required' },
        { status: 400 }
      )
    }

    const events = await recommendationService.getEventsForTimeSlots(
      timeSlots,
      excludeEventIds,
      limit
    )

    return NextResponse.json({
      recommendations: events,
      timeSlotCount: timeSlots.length,
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error getting events for time slots:', error)
    return NextResponse.json(
      { error: 'Failed to get events for time slots' },
      { status: 500 }
    )
  }
}
