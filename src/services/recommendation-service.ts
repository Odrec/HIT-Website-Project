// Recommendation Service - Smart event recommendations based on user context

import { prisma } from '@/lib/db/prisma'
import { EventType, LocationType, Institution } from '@/types/events'
import type { Event } from '@/types/events'
import type {
  RecommendationContext,
  RecommendationFilters,
  RecommendationResult,
  EventRecommendation,
  RecommendationGroup,
  RecommendationReason,
  BatchAddRequest,
  BatchAddResult,
  ScheduleOptimizationResult,
  ScheduleOptimization,
  TimeSlot,
  EventPopularity,
} from '@/types/recommendations'

// In-memory store for event popularity (would be Redis in production)
const eventPopularityStore: Map<string, EventPopularity> = new Map()

/**
 * Calculate time overlap between two events in minutes
 */
function calculateOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): number {
  const overlapStart = Math.max(start1.getTime(), start2.getTime())
  const overlapEnd = Math.min(end1.getTime(), end2.getTime())
  const overlapMs = Math.max(0, overlapEnd - overlapStart)
  return Math.floor(overlapMs / (1000 * 60))
}

/**
 * Check if an event fits within a time slot
 */
function eventFitsTimeSlot(event: Event, slot: TimeSlot): boolean {
  if (!event.timeStart || !event.timeEnd) return false
  
  const eventStart = new Date(event.timeStart).getTime()
  const eventEnd = new Date(event.timeEnd).getTime()
  const slotStart = new Date(slot.start).getTime()
  const slotEnd = new Date(slot.end).getTime()
  
  return eventStart >= slotStart && eventEnd <= slotEnd
}

/**
 * Calculate estimated walking time between locations (simplified)
 * In production, this would use actual map data
 */
function estimateTravelTime(location1?: string, location2?: string): number {
  if (!location1 || !location2) return 0
  if (location1 === location2) return 0
  
  // Simplified: assume 5-15 minutes between different buildings
  // Same building = 2 minutes
  if (location1.split(' ')[0] === location2.split(' ')[0]) {
    return 2
  }
  return 10 // Average walking time between buildings
}

/**
 * Map Prisma event to our Event type
 */
function mapPrismaEvent(prismaEvent: {
  id: string
  title: string
  description: string | null
  eventType: string
  timeStart: Date | null
  timeEnd: Date | null
  locationType: string
  locationDetails: unknown
  roomRequest: string | null
  meetingPoint: string | null
  additionalInfo: string | null
  photoUrl: string | null
  institution: string
  locationId: string | null
  createdAt: Date
  updatedAt: Date
  location?: { id: string; buildingName: string; roomNumber: string | null; address: string | null; latitude: number | null; longitude: number | null } | null
  lecturers?: Array<{ id: string; firstName: string; lastName: string; title: string | null; eventId: string }>
  studyPrograms?: Array<{ studyProgram: { id: string; name: string; institution: string } }>
  organizers?: Array<{ id: string; email: string; phone: string | null; internalOnly: boolean; eventId: string }>
}): Event {
  return {
    id: prismaEvent.id,
    title: prismaEvent.title,
    description: prismaEvent.description ?? undefined,
    eventType: EventType[prismaEvent.eventType as keyof typeof EventType],
    timeStart: prismaEvent.timeStart ?? undefined,
    timeEnd: prismaEvent.timeEnd ?? undefined,
    locationType: LocationType[prismaEvent.locationType as keyof typeof LocationType],
    locationDetails: prismaEvent.locationDetails as Record<string, unknown> | undefined,
    roomRequest: prismaEvent.roomRequest ?? undefined,
    meetingPoint: prismaEvent.meetingPoint ?? undefined,
    additionalInfo: prismaEvent.additionalInfo ?? undefined,
    photoUrl: prismaEvent.photoUrl ?? undefined,
    institution: Institution[prismaEvent.institution as keyof typeof Institution],
    locationId: prismaEvent.locationId ?? undefined,
    location: prismaEvent.location ? {
      id: prismaEvent.location.id,
      buildingName: prismaEvent.location.buildingName,
      roomNumber: prismaEvent.location.roomNumber ?? undefined,
      address: prismaEvent.location.address ?? undefined,
      latitude: prismaEvent.location.latitude ?? undefined,
      longitude: prismaEvent.location.longitude ?? undefined,
    } : undefined,
    lecturers: prismaEvent.lecturers?.map(l => ({
      id: l.id,
      eventId: l.eventId,
      firstName: l.firstName,
      lastName: l.lastName,
      title: l.title ?? undefined,
    })),
    studyPrograms: prismaEvent.studyPrograms?.map(sp => ({
      id: sp.studyProgram.id,
      name: sp.studyProgram.name,
      institution: Institution[sp.studyProgram.institution as keyof typeof Institution],
    })),
    organizers: prismaEvent.organizers?.map(o => ({
      id: o.id,
      eventId: o.eventId,
      email: o.email,
      phone: o.phone ?? undefined,
      internalOnly: o.internalOnly,
    })),
    createdAt: prismaEvent.createdAt,
    updatedAt: prismaEvent.updatedAt,
  }
}

/**
 * Recommendation Service
 */
export const recommendationService = {
  /**
   * Generate personalized event recommendations
   */
  async generateRecommendations(
    context: RecommendationContext,
    filters: RecommendationFilters = {}
  ): Promise<RecommendationResult> {
    const {
      scheduledEventIds = [],
      studyProgramIds = [],
      availableTimeSlots = [],
      institution,
      preferredEventTypes = [],
      viewedEventIds = [],
      dismissedEventIds = [],
      maxTravelTime = 15,
    } = context

    const {
      startDate,
      endDate,
      excludeConflicts = false,
      onlyHighDemand = false,
      eventTypes,
      minScore = 0,
      limit = 20,
    } = filters

    // Build query to fetch candidate events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    
    // Exclude already scheduled events
    if (scheduledEventIds.length > 0) {
      where.id = { notIn: scheduledEventIds }
    }
    
    // Exclude dismissed events
    if (dismissedEventIds.length > 0) {
      where.id = where.id 
        ? { ...where.id, notIn: [...(where.id.notIn || []), ...dismissedEventIds] }
        : { notIn: dismissedEventIds }
    }
    
    // Filter by date range
    if (startDate || endDate) {
      where.timeStart = {}
      if (startDate) where.timeStart.gte = startDate
      if (endDate) where.timeStart.lte = endDate
    }
    
    // Filter by institution
    if (institution && institution !== 'BOTH') {
      where.OR = [
        { institution: institution },
        { institution: 'BOTH' },
      ]
    }
    
    // Filter by event types
    if (eventTypes && eventTypes.length > 0) {
      where.eventType = { in: eventTypes }
    }

    // Fetch candidate events
    const events = await prisma.event.findMany({
      where,
      include: {
        location: true,
        lecturers: true,
        studyPrograms: {
          include: {
            studyProgram: true,
          },
        },
      },
      take: 100, // Get more candidates for scoring
    })

    // Fetch scheduled events for conflict detection
    const scheduledEvents = scheduledEventIds.length > 0
      ? await prisma.event.findMany({
          where: { id: { in: scheduledEventIds } },
          include: { location: true },
        })
      : []

    // Score each event
    const recommendations: EventRecommendation[] = []

    for (const prismaEvent of events) {
      const event = mapPrismaEvent(prismaEvent)
      const reasons: RecommendationReason[] = []
      let score = 0

      // 1. Study program matching (highest weight)
      const eventProgramIds = prismaEvent.studyPrograms.map(sp => sp.studyProgramId)
      const matchingPrograms = eventProgramIds.filter(id => studyProgramIds.includes(id))
      
      if (matchingPrograms.length > 0) {
        const programScore = Math.min(40, matchingPrograms.length * 20)
        score += programScore
        reasons.push({
          type: 'study_program',
          description: `Passt zu ${matchingPrograms.length} deiner Studiengänge`,
          weight: programScore / 100,
        })
      }

      // 2. Event type preference
      if (preferredEventTypes.includes(event.eventType)) {
        score += 15
        reasons.push({
          type: 'event_type',
          description: `Entspricht deinem bevorzugten Veranstaltungstyp`,
          weight: 0.15,
        })
      }

      // 3. Time slot fitting
      if (availableTimeSlots.length > 0 && event.timeStart && event.timeEnd) {
        const fitsSlot = availableTimeSlots.some(slot => eventFitsTimeSlot(event, slot))
        if (fitsSlot) {
          score += 15
          reasons.push({
            type: 'time_fit',
            description: 'Passt in deinen verfügbaren Zeitrahmen',
            weight: 0.15,
          })
        }
      }

      // 4. No conflict bonus
      let conflictsWithSchedule = false
      const conflictingEventIds: string[] = []

      if (event.timeStart && event.timeEnd) {
        for (const scheduled of scheduledEvents) {
          if (scheduled.timeStart && scheduled.timeEnd) {
            const overlap = calculateOverlap(
              new Date(event.timeStart),
              new Date(event.timeEnd),
              scheduled.timeStart,
              scheduled.timeEnd
            )
            if (overlap > 0) {
              conflictsWithSchedule = true
              conflictingEventIds.push(scheduled.id)
            }
          }
        }
      }

      if (!conflictsWithSchedule && scheduledEventIds.length > 0) {
        score += 10
        reasons.push({
          type: 'no_conflict',
          description: 'Keine Überschneidung mit deinem Zeitplan',
          weight: 0.1,
        })
      }

      // 5. Popularity score
      const popularity = eventPopularityStore.get(event.id)
      const isHighDemand = popularity ? popularity.popularityScore > 70 : false
      
      if (isHighDemand) {
        score += 10
        reasons.push({
          type: 'popularity',
          description: 'Beliebte Veranstaltung',
          weight: 0.1,
        })
      }

      // 6. Diversity bonus (event types not yet in schedule)
      const scheduledEventTypes = scheduledEvents.map(e => e.eventType)
      if (!scheduledEventTypes.includes(event.eventType)) {
        score += 5
        reasons.push({
          type: 'diversity',
          description: 'Bietet Abwechslung zu deinem Zeitplan',
          weight: 0.05,
        })
      }

      // 7. Location/travel time consideration
      let travelTimeFromPrevious: number | undefined
      if (scheduledEvents.length > 0 && event.timeStart) {
        const eventStartTime = new Date(event.timeStart).getTime()
        const previousEvent = scheduledEvents
          .filter(e => e.timeEnd && new Date(e.timeEnd).getTime() < eventStartTime)
          .sort((a, b) => 
            new Date(b.timeEnd!).getTime() - new Date(a.timeEnd!).getTime()
          )[0]

        if (previousEvent) {
          travelTimeFromPrevious = estimateTravelTime(
            previousEvent.location?.buildingName,
            event.location?.buildingName
          )
          
          const timeBetween = previousEvent.timeEnd
            ? (eventStartTime - new Date(previousEvent.timeEnd).getTime()) / (1000 * 60)
            : 0
          
          if (travelTimeFromPrevious <= timeBetween && travelTimeFromPrevious <= maxTravelTime) {
            score += 5
            reasons.push({
              type: 'location',
              description: `Nur ${travelTimeFromPrevious} Min. Fußweg vom vorherigen Event`,
              weight: 0.05,
            })
          }
        }
      }

      // Skip if filtering by conflicts and has conflicts
      if (excludeConflicts && conflictsWithSchedule) continue

      // Skip if only showing high demand and isn't
      if (onlyHighDemand && !isHighDemand) continue

      // Skip if below minimum score
      if (score < minScore) continue

      // Add viewed bonus (slightly lower score to prioritize new content)
      if (viewedEventIds.includes(event.id)) {
        score -= 5 // Slightly deprioritize already viewed events
      }

      recommendations.push({
        event,
        score: Math.min(100, Math.max(0, score)),
        reasons,
        conflictsWithSchedule,
        conflictingEventIds,
        travelTimeFromPrevious,
        isHighDemand,
      })
    }

    // Sort by score and limit
    recommendations.sort((a, b) => b.score - a.score)
    const limitedRecommendations = recommendations.slice(0, limit)

    // Group recommendations
    const groups = this.groupRecommendations(limitedRecommendations)

    return {
      recommendations: limitedRecommendations,
      groups,
      totalAvailable: recommendations.length,
      generatedAt: new Date(),
      context: {
        studyProgramCount: studyProgramIds.length,
        availableSlotCount: availableTimeSlots.length,
        scheduledEventCount: scheduledEventIds.length,
      },
    }
  },

  /**
   * Group recommendations by category
   */
  groupRecommendations(recommendations: EventRecommendation[]): RecommendationGroup[] {
    const groups: RecommendationGroup[] = []

    // Group by study program
    const byProgram: Record<string, EventRecommendation[]> = {}
    for (const rec of recommendations) {
      for (const program of rec.event.studyPrograms || []) {
        if (!byProgram[program.name]) {
          byProgram[program.name] = []
        }
        byProgram[program.name].push(rec)
      }
    }
    
    for (const programName of Object.keys(byProgram)) {
      const recs = byProgram[programName]
      if (recs.length >= 2) {
        groups.push({
          category: programName,
          categoryType: 'study_program',
          recommendations: recs,
          averageScore: recs.reduce((sum: number, r: EventRecommendation) => sum + r.score, 0) / recs.length,
        })
      }
    }

    // Group by event type
    const byType: Record<string, EventRecommendation[]> = {}
    for (const rec of recommendations) {
      const type = rec.event.eventType
      if (!byType[type]) {
        byType[type] = []
      }
      byType[type].push(rec)
    }
    
    const eventTypeLabels: Record<string, string> = {
      VORTRAG: 'Vorträge',
      LABORFUEHRUNG: 'Laborführungen',
      RUNDGANG: 'Rundgänge',
      WORKSHOP: 'Workshops',
      LINK: 'Online-Links',
      INFOSTAND: 'Infostände',
    }
    
    for (const type of Object.keys(byType)) {
      const recs = byType[type]
      if (recs.length >= 2) {
        groups.push({
          category: eventTypeLabels[type] || type,
          categoryType: 'event_type',
          recommendations: recs,
          averageScore: recs.reduce((sum: number, r: EventRecommendation) => sum + r.score, 0) / recs.length,
        })
      }
    }

    // Sort groups by average score
    groups.sort((a, b) => b.averageScore - a.averageScore)

    return groups
  },

  /**
   * Batch add multiple events to schedule
   */
  async batchAddEvents(
    request: BatchAddRequest,
    scheduledEventIds: string[]
  ): Promise<BatchAddResult> {
    const { eventIds, skipConflicts = true } = request

    // Fetch all events
    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
    })

    const scheduledEvents = scheduledEventIds.length > 0
      ? await prisma.event.findMany({
          where: { id: { in: scheduledEventIds } },
        })
      : []

    const addedEventIds: string[] = []
    const skippedEventIds: string[] = []
    const conflictingEventIds: string[] = []

    for (const event of events) {
      // Check for conflicts with existing schedule
      let hasConflict = false
      
      if (event.timeStart && event.timeEnd) {
        for (const scheduled of [...scheduledEvents, ...events.filter(e => addedEventIds.includes(e.id))]) {
          if (scheduled.id === event.id) continue
          if (scheduled.timeStart && scheduled.timeEnd) {
            const overlap = calculateOverlap(
              event.timeStart,
              event.timeEnd,
              scheduled.timeStart,
              scheduled.timeEnd
            )
            if (overlap > 0) {
              hasConflict = true
              break
            }
          }
        }
      }

      if (hasConflict) {
        conflictingEventIds.push(event.id)
        if (skipConflicts) {
          skippedEventIds.push(event.id)
          continue
        }
      }

      addedEventIds.push(event.id)
    }

    return {
      addedCount: addedEventIds.length,
      skippedCount: skippedEventIds.length,
      conflictCount: conflictingEventIds.length,
      addedEventIds,
      skippedEventIds,
      conflictingEventIds,
    }
  },

  /**
   * Analyze schedule and suggest optimizations
   */
  async analyzeSchedule(scheduledEventIds: string[]): Promise<ScheduleOptimizationResult> {
    if (scheduledEventIds.length === 0) {
      return {
        currentScore: 0,
        optimizations: [],
        gaps: [],
        conflicts: [],
        diversity: {
          eventTypeDistribution: {},
          studyProgramDistribution: {},
          locationDistribution: {},
        },
      }
    }

    const events = await prisma.event.findMany({
      where: { id: { in: scheduledEventIds } },
      include: {
        location: true,
        studyPrograms: {
          include: { studyProgram: true },
        },
      },
      orderBy: { timeStart: 'asc' },
    })

    // Detect conflicts
    const conflicts: { event1Id: string; event1Title: string; event2Id: string; event2Title: string; overlapMinutes: number }[] = []
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const e1 = events[i]
        const e2 = events[j]
        
        if (e1.timeStart && e1.timeEnd && e2.timeStart && e2.timeEnd) {
          const overlap = calculateOverlap(e1.timeStart, e1.timeEnd, e2.timeStart, e2.timeEnd)
          if (overlap > 0) {
            conflicts.push({
              event1Id: e1.id,
              event1Title: e1.title,
              event2Id: e2.id,
              event2Title: e2.title,
              overlapMinutes: overlap,
            })
          }
        }
      }
    }

    // Find gaps between events (only same-day gaps)
    const gaps: TimeSlot[] = []
    const sortedEvents = events
      .filter(e => e.timeStart && e.timeEnd)
      .sort((a, b) => new Date(a.timeStart!).getTime() - new Date(b.timeStart!).getTime())

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const current = sortedEvents[i]
      const next = sortedEvents[i + 1]
      
      if (current.timeEnd && next.timeStart) {
        const gapStart = new Date(current.timeEnd)
        const gapEnd = new Date(next.timeStart)
        
        // Only count gaps on the same day
        const sameDay = gapStart.toDateString() === gapEnd.toDateString()
        if (!sameDay) continue
        
        const gapMinutes = (gapEnd.getTime() - gapStart.getTime()) / (1000 * 60)
        
        // Only count gaps of 30+ minutes but less than 8 hours (reasonable daily gaps)
        if (gapMinutes >= 30 && gapMinutes <= 480) {
          gaps.push({
            start: gapStart,
            end: gapEnd,
            durationMinutes: Math.round(gapMinutes),
          })
        }
      }
    }

    // Calculate diversity
    const eventTypeDistribution: Record<string, number> = {}
    const studyProgramDistribution: Record<string, number> = {}
    const locationDistribution: Record<string, number> = {}

    for (const event of events) {
      // Event types
      eventTypeDistribution[event.eventType] = (eventTypeDistribution[event.eventType] || 0) + 1
      
      // Study programs
      for (const sp of event.studyPrograms) {
        studyProgramDistribution[sp.studyProgram.name] = 
          (studyProgramDistribution[sp.studyProgram.name] || 0) + 1
      }
      
      // Locations
      if (event.location) {
        locationDistribution[event.location.buildingName] = 
          (locationDistribution[event.location.buildingName] || 0) + 1
      }
    }

    // Generate optimization suggestions
    const optimizations: ScheduleOptimization[] = []

    // Suggest conflict resolution (one per conflict, not duplicates)
    for (const conflict of conflicts) {
      optimizations.push({
        type: 'resolve_conflict',
        description: `„${conflict.event1Title}" und „${conflict.event2Title}" überschneiden sich um ${conflict.overlapMinutes} Min.`,
        suggestedAction: {
          action: 'remove',
          eventIds: [conflict.event1Id, conflict.event2Id],
          reason: `Entferne „${conflict.event1Title}" oder „${conflict.event2Title}" um den Konflikt zu lösen`,
        },
        benefitScore: 30,
      })
    }

    // Suggest filling gaps with recommendations
    for (const gap of gaps) {
      if (gap.durationMinutes >= 45) { // Enough time for another event
        optimizations.push({
          type: 'fill_gap',
          description: `Lücke von ${gap.durationMinutes} Minuten gefunden`,
          suggestedAction: {
            action: 'add',
            eventIds: [],
            reason: `Veranstaltung zwischen ${gap.start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} und ${gap.end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} hinzufügen`,
          },
          benefitScore: 15,
        })
      }
    }

    // Suggest diversity improvements
    const eventTypeCount = Object.keys(eventTypeDistribution).length
    if (eventTypeCount === 1 && events.length >= 3) {
      optimizations.push({
        type: 'add_diversity',
        description: 'Alle Veranstaltungen sind vom gleichen Typ',
        suggestedAction: {
          action: 'add',
          eventIds: [],
          reason: 'Andere Veranstaltungstypen hinzufügen für mehr Abwechslung',
        },
        benefitScore: 10,
      })
    }

    // Calculate overall score
    let currentScore = 50 // Base score

    // Deduct for conflicts
    currentScore -= conflicts.length * 15

    // Add for diversity
    currentScore += Math.min(20, eventTypeCount * 5)

    // Add for number of events
    currentScore += Math.min(20, events.length * 2)

    // Deduct for too many gaps
    currentScore -= Math.min(10, gaps.length * 2)

    currentScore = Math.max(0, Math.min(100, currentScore))

    return {
      currentScore,
      optimizations,
      gaps,
      conflicts,
      diversity: {
        eventTypeDistribution,
        studyProgramDistribution,
        locationDistribution,
      },
    }
  },

  /**
   * Track event view for popularity
   */
  trackEventView(eventId: string): void {
    const existing = eventPopularityStore.get(eventId)
    if (existing) {
      existing.viewCount += 1
      existing.popularityScore = this.calculatePopularityScore(existing.viewCount, existing.addToScheduleCount)
    } else {
      eventPopularityStore.set(eventId, {
        eventId,
        viewCount: 1,
        addToScheduleCount: 0,
        popularityScore: 10,
        trend: 'stable',
      })
    }
  },

  /**
   * Track event added to schedule for popularity
   */
  trackEventScheduled(eventId: string): void {
    const existing = eventPopularityStore.get(eventId)
    if (existing) {
      existing.addToScheduleCount += 1
      existing.popularityScore = this.calculatePopularityScore(existing.viewCount, existing.addToScheduleCount)
    } else {
      eventPopularityStore.set(eventId, {
        eventId,
        viewCount: 0,
        addToScheduleCount: 1,
        popularityScore: 30,
        trend: 'rising',
      })
    }
  },

  /**
   * Calculate popularity score from metrics
   */
  calculatePopularityScore(views: number, schedules: number): number {
    // Schedules are worth more than views
    const rawScore = views * 1 + schedules * 10
    // Normalize to 0-100
    return Math.min(100, Math.floor(rawScore / 2))
  },

  /**
   * Get top popular events
   */
  async getPopularEvents(limit: number = 10): Promise<EventRecommendation[]> {
    const sortedPopularity = Array.from(eventPopularityStore.values())
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit)

    if (sortedPopularity.length === 0) {
      return []
    }

    const eventIds = sortedPopularity.map(p => p.eventId)
    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      include: {
        location: true,
        lecturers: true,
        studyPrograms: {
          include: { studyProgram: true },
        },
      },
    })

    return events.map(prismaEvent => {
      const event = mapPrismaEvent(prismaEvent)
      const popularity = eventPopularityStore.get(event.id)
      return {
        event,
        score: popularity?.popularityScore || 50,
        reasons: [{
          type: 'popularity' as const,
          description: `${popularity?.addToScheduleCount || 0} Mal zum Zeitplan hinzugefügt`,
          weight: 1,
        }],
        conflictsWithSchedule: false,
        conflictingEventIds: [],
        isHighDemand: (popularity?.popularityScore || 0) > 70,
      }
    })
  },

  /**
   * Get events that fit in available time slots
   */
  async getEventsForTimeSlots(
    timeSlots: TimeSlot[],
    excludeEventIds: string[] = [],
    limit: number = 10
  ): Promise<EventRecommendation[]> {
    if (timeSlots.length === 0) return []

    // Find the overall time range
    const minStart = new Date(Math.min(...timeSlots.map(s => new Date(s.start).getTime())))
    const maxEnd = new Date(Math.max(...timeSlots.map(s => new Date(s.end).getTime())))

    const events = await prisma.event.findMany({
      where: {
        id: excludeEventIds.length > 0 ? { notIn: excludeEventIds } : undefined,
        timeStart: { gte: minStart },
        timeEnd: { lte: maxEnd },
      },
      include: {
        location: true,
        lecturers: true,
        studyPrograms: {
          include: { studyProgram: true },
        },
      },
    })

    const recommendations: EventRecommendation[] = []

    for (const prismaEvent of events) {
      const event = mapPrismaEvent(prismaEvent)
      
      if (!event.timeStart || !event.timeEnd) continue

      // Check if event fits any slot
      const fittingSlot = timeSlots.find(slot => eventFitsTimeSlot(event, slot))
      
      if (fittingSlot) {
        recommendations.push({
          event,
          score: 75, // High score for time fit
          reasons: [{
            type: 'time_fit',
            description: 'Passt perfekt in deinen verfügbaren Zeitrahmen',
            weight: 0.75,
          }],
          conflictsWithSchedule: false,
          conflictingEventIds: [],
          isHighDemand: false,
        })
      }
    }

    return recommendations.slice(0, limit)
  },
}

export default recommendationService
