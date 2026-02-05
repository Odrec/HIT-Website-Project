// Schedule Analysis API - Analyze and optimize user schedules

import { NextRequest, NextResponse } from 'next/server'
import { recommendationService } from '@/services/recommendation-service'

/**
 * POST /api/recommendations/analyze
 * Analyze a schedule and get optimization suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduledEventIds } = body

    if (!scheduledEventIds || !Array.isArray(scheduledEventIds)) {
      return NextResponse.json({ error: 'scheduledEventIds array required' }, { status: 400 })
    }

    const analysis = await recommendationService.analyzeSchedule(scheduledEventIds)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing schedule:', error)
    return NextResponse.json({ error: 'Failed to analyze schedule' }, { status: 500 })
  }
}
