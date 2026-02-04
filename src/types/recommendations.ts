// Recommendation Engine Types and Interfaces

import type { Event } from './events'

/**
 * Available time slot for scheduling
 */
export interface TimeSlot {
  start: Date
  end: Date
  durationMinutes: number
}

/**
 * Reason why an event was recommended
 */
export interface RecommendationReason {
  type: 'study_program' | 'event_type' | 'time_fit' | 'popularity' | 'diversity' | 'location' | 'no_conflict'
  description: string
  weight: number // 0-1 contribution to overall score
}

/**
 * Single event recommendation with scoring
 */
export interface EventRecommendation {
  event: Event
  score: number // 0-100 relevance score
  reasons: RecommendationReason[]
  conflictsWithSchedule: boolean
  conflictingEventIds: string[]
  travelTimeFromPrevious?: number // minutes
  isHighDemand: boolean
}

/**
 * Grouped recommendations by category
 */
export interface RecommendationGroup {
  category: string
  categoryType: 'study_program' | 'event_type' | 'time_slot' | 'location'
  recommendations: EventRecommendation[]
  averageScore: number
}

/**
 * User's context for generating recommendations
 */
export interface RecommendationContext {
  // User's current schedule
  scheduledEventIds: string[]
  
  // Preferred study programs (from navigator or explicit selection)
  studyProgramIds: string[]
  
  // Available time windows
  availableTimeSlots: TimeSlot[]
  
  // Institution preference
  institution?: 'UNI' | 'HOCHSCHULE' | 'BOTH'
  
  // Event types the user is interested in
  preferredEventTypes?: string[]
  
  // Events the user has already viewed
  viewedEventIds?: string[]
  
  // Events the user explicitly dismissed
  dismissedEventIds?: string[]
  
  // Maximum travel time between events (minutes)
  maxTravelTime?: number
}

/**
 * Filters for recommendation query
 */
export interface RecommendationFilters {
  // Limit to specific time range
  startDate?: Date
  endDate?: Date
  
  // Only show events that don't conflict
  excludeConflicts?: boolean
  
  // Only show high-demand events
  onlyHighDemand?: boolean
  
  // Event types to include
  eventTypes?: string[]
  
  // Minimum score threshold
  minScore?: number
  
  // Maximum number of recommendations
  limit?: number
}

/**
 * Result of recommendation generation
 */
export interface RecommendationResult {
  recommendations: EventRecommendation[]
  groups: RecommendationGroup[]
  totalAvailable: number
  generatedAt: Date
  context: {
    studyProgramCount: number
    availableSlotCount: number
    scheduledEventCount: number
  }
}

/**
 * Batch add request for adding multiple events at once
 */
export interface BatchAddRequest {
  eventIds: string[]
  skipConflicts?: boolean
  priorityOverride?: number
}

/**
 * Result of batch add operation
 */
export interface BatchAddResult {
  addedCount: number
  skippedCount: number
  conflictCount: number
  addedEventIds: string[]
  skippedEventIds: string[]
  conflictingEventIds: string[]
}

/**
 * Schedule optimization suggestion
 */
export interface ScheduleOptimization {
  type: 'resolve_conflict' | 'fill_gap' | 'reduce_travel' | 'add_diversity'
  description: string
  suggestedAction: {
    action: 'swap' | 'remove' | 'add' | 'move'
    eventIds: string[]
    reason: string
  }
  benefitScore: number // 0-100 how much this helps
}

/**
 * Overall schedule analysis with optimization suggestions
 */
export interface ScheduleOptimizationResult {
  currentScore: number // 0-100 how good the schedule is
  optimizations: ScheduleOptimization[]
  gaps: TimeSlot[] // unscheduled time periods
  conflicts: {
    event1Id: string
    event1Title: string
    event2Id: string
    event2Title: string
    overlapMinutes: number
  }[]
  diversity: {
    eventTypeDistribution: Record<string, number>
    studyProgramDistribution: Record<string, number>
    locationDistribution: Record<string, number>
  }
}

/**
 * Quick action for recommendations
 */
export interface RecommendationAction {
  type: 'add_to_schedule' | 'dismiss' | 'view_details' | 'add_all_from_program'
  eventId?: string
  eventIds?: string[]
  studyProgramId?: string
}

/**
 * Popularity metrics for an event
 */
export interface EventPopularity {
  eventId: string
  viewCount: number
  addToScheduleCount: number
  popularityScore: number // calculated from views and adds
  trend: 'rising' | 'stable' | 'falling'
}
