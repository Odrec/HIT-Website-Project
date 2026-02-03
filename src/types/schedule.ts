// Schedule-related TypeScript types

import type { Event } from './events'

export interface ScheduleItem {
  id: string
  scheduleId: string
  eventId: string
  event?: Event
  priority: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserSchedule {
  id: string
  userId?: string
  sessionId?: string
  name: string
  items: ScheduleItem[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateScheduleInput {
  name?: string
  userId?: string
  sessionId?: string
}

export interface AddScheduleItemInput {
  scheduleId: string
  eventId: string
  priority?: number
  notes?: string
}

export interface UpdateScheduleItemInput {
  id: string
  priority?: number
  notes?: string
}

// Schedule conflict types
export interface TimeConflict {
  item1: ScheduleItem
  item2: ScheduleItem
  overlapMinutes: number
}

export interface ScheduleAnalysis {
  totalEvents: number
  totalDuration: number // in minutes
  conflicts: TimeConflict[]
  earliestStart?: Date
  latestEnd?: Date
  eventsByType: Record<string, number>
}
