// Recommendations API - Get personalized event recommendations

import { NextRequest, NextResponse } from 'next/server'
import { recommendationService } from '@/services/recommendation-service'
import type { RecommendationContext, RecommendationFilters } from '@/types/recommendations'

/**
 * GET /api/recommendations
 * Get personalized event recommendations based on context
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse context from query params
    const scheduledEventIds = searchParams.get('scheduledEventIds')?.split(',').filter(Boolean) || []
    const studyProgramIds = searchParams.get('studyProgramIds')?.split(',').filter(Boolean) || []
    const institution = searchParams.get('institution') as 'UNI' | 'HOCHSCHULE' | 'BOTH' | undefined
    const preferredEventTypes = searchParams.get('preferredEventTypes')?.split(',').filter(Boolean) || []
    const viewedEventIds = searchParams.get('viewedEventIds')?.split(',').filter(Boolean) || []
    const dismissedEventIds = searchParams.get('dismissedEventIds')?.split(',').filter(Boolean) || []
    const maxTravelTime = searchParams.get('maxTravelTime') 
      ? parseInt(searchParams.get('maxTravelTime')!, 10) 
      : undefined

    // Parse filters
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : undefined
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : undefined
    const excludeConflicts = searchParams.get('excludeConflicts') === 'true'
    const onlyHighDemand = searchParams.get('onlyHighDemand') === 'true'
    const eventTypes = searchParams.get('eventTypes')?.split(',').filter(Boolean)
    const minScore = searchParams.get('minScore') 
      ? parseInt(searchParams.get('minScore')!, 10) 
      : undefined
    const limit = searchParams.get('limit') 
      ? parseInt(searchParams.get('limit')!, 10) 
      : 20

    const context: RecommendationContext = {
      scheduledEventIds,
      studyProgramIds,
      availableTimeSlots: [], // Time slots would be passed as JSON in POST
      institution,
      preferredEventTypes,
      viewedEventIds,
      dismissedEventIds,
      maxTravelTime,
    }

    const filters: RecommendationFilters = {
      startDate,
      endDate,
      excludeConflicts,
      onlyHighDemand,
      eventTypes,
      minScore,
      limit,
    }

    const result = await recommendationService.generateRecommendations(context, filters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recommendations
 * Get recommendations with full context (including time slots)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const context: RecommendationContext = {
      scheduledEventIds: body.scheduledEventIds || [],
      studyProgramIds: body.studyProgramIds || [],
      availableTimeSlots: (body.availableTimeSlots || []).map((slot: { start: string; end: string; durationMinutes?: number }) => ({
        start: new Date(slot.start),
        end: new Date(slot.end),
        durationMinutes: slot.durationMinutes || 
          Math.floor((new Date(slot.end).getTime() - new Date(slot.start).getTime()) / (1000 * 60)),
      })),
      institution: body.institution,
      preferredEventTypes: body.preferredEventTypes || [],
      viewedEventIds: body.viewedEventIds || [],
      dismissedEventIds: body.dismissedEventIds || [],
      maxTravelTime: body.maxTravelTime,
    }

    const filters: RecommendationFilters = {
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      excludeConflicts: body.excludeConflicts ?? false,
      onlyHighDemand: body.onlyHighDemand ?? false,
      eventTypes: body.eventTypes,
      minScore: body.minScore,
      limit: body.limit ?? 20,
    }

    const result = await recommendationService.generateRecommendations(context, filters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
