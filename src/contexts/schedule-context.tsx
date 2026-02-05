'use client'

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import type { Event } from '@/types/events'

// Types for client-side schedule management
export interface ScheduleEvent {
  id: string
  eventId: string
  event: Event
  priority: number
  addedAt: Date
}

export interface TimeConflict {
  event1: ScheduleEvent
  event2: ScheduleEvent
  overlapMinutes: number
}

export interface ScheduleState {
  items: ScheduleEvent[]
  conflicts: TimeConflict[]
  isLoaded: boolean
}

type ScheduleAction =
  | { type: 'LOAD_SCHEDULE'; payload: ScheduleEvent[] }
  | { type: 'ADD_EVENT'; payload: ScheduleEvent }
  | { type: 'REMOVE_EVENT'; payload: string }
  | { type: 'UPDATE_PRIORITY'; payload: { eventId: string; priority: number } }
  | { type: 'CLEAR_SCHEDULE' }
  | { type: 'SET_CONFLICTS'; payload: TimeConflict[] }

interface ScheduleContextType {
  state: ScheduleState
  addEvent: (event: Event) => void
  removeEvent: (eventId: string) => void
  isInSchedule: (eventId: string) => boolean
  updatePriority: (eventId: string, priority: number) => void
  clearSchedule: () => void
  getEventCount: () => number
  getConflicts: () => TimeConflict[]
  getScheduleUrl: () => string
}

const STORAGE_KEY = 'hit-schedule'

// Calculate overlap between two time ranges in minutes
function calculateOverlap(start1: Date, end1: Date, start2: Date, end2: Date): number {
  const overlapStart = Math.max(start1.getTime(), start2.getTime())
  const overlapEnd = Math.min(end1.getTime(), end2.getTime())
  const overlapMs = Math.max(0, overlapEnd - overlapStart)
  return Math.floor(overlapMs / (1000 * 60))
}

// Detect conflicts between schedule items
function detectConflicts(items: ScheduleEvent[]): TimeConflict[] {
  const conflicts: TimeConflict[] = []

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const event1 = items[i]
      const event2 = items[j]

      // Skip if either event doesn't have times
      if (
        !event1.event.timeStart ||
        !event1.event.timeEnd ||
        !event2.event.timeStart ||
        !event2.event.timeEnd
      ) {
        continue
      }

      const start1 = new Date(event1.event.timeStart)
      const end1 = new Date(event1.event.timeEnd)
      const start2 = new Date(event2.event.timeStart)
      const end2 = new Date(event2.event.timeEnd)

      const overlapMinutes = calculateOverlap(start1, end1, start2, end2)

      if (overlapMinutes > 0) {
        conflicts.push({
          event1,
          event2,
          overlapMinutes,
        })
      }
    }
  }

  return conflicts
}

function scheduleReducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case 'LOAD_SCHEDULE': {
      const conflicts = detectConflicts(action.payload)
      return {
        ...state,
        items: action.payload,
        conflicts,
        isLoaded: true,
      }
    }
    case 'ADD_EVENT': {
      const newItems = [...state.items, action.payload]
      const conflicts = detectConflicts(newItems)
      return {
        ...state,
        items: newItems,
        conflicts,
      }
    }
    case 'REMOVE_EVENT': {
      const newItems = state.items.filter((item) => item.eventId !== action.payload)
      const conflicts = detectConflicts(newItems)
      return {
        ...state,
        items: newItems,
        conflicts,
      }
    }
    case 'UPDATE_PRIORITY': {
      const newItems = state.items.map((item) =>
        item.eventId === action.payload.eventId
          ? { ...item, priority: action.payload.priority }
          : item
      )
      return {
        ...state,
        items: newItems,
      }
    }
    case 'CLEAR_SCHEDULE': {
      return {
        ...state,
        items: [],
        conflicts: [],
      }
    }
    case 'SET_CONFLICTS': {
      return {
        ...state,
        conflicts: action.payload,
      }
    }
    default:
      return state
  }
}

const initialState: ScheduleState = {
  items: [],
  conflicts: [],
  isLoaded: false,
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined)

interface ScheduleProviderProps {
  children: React.ReactNode
}

export function ScheduleProvider({ children }: ScheduleProviderProps) {
  const [state, dispatch] = useReducer(scheduleReducer, initialState)

  // Load schedule from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Restore dates from JSON strings
        const items: ScheduleEvent[] = parsed.map(
          (item: {
            id: string
            eventId: string
            event: Event & {
              timeStart?: string
              timeEnd?: string
              createdAt: string
              updatedAt: string
            }
            priority: number
            addedAt: string
          }) => ({
            ...item,
            addedAt: new Date(item.addedAt),
            event: {
              ...item.event,
              timeStart: item.event.timeStart ? new Date(item.event.timeStart) : undefined,
              timeEnd: item.event.timeEnd ? new Date(item.event.timeEnd) : undefined,
              createdAt: new Date(item.event.createdAt),
              updatedAt: new Date(item.event.updatedAt),
            },
          })
        )
        dispatch({ type: 'LOAD_SCHEDULE', payload: items })
      } else {
        dispatch({ type: 'LOAD_SCHEDULE', payload: [] })
      }
    } catch {
      console.error('Failed to load schedule from localStorage')
      dispatch({ type: 'LOAD_SCHEDULE', payload: [] })
    }
  }, [])

  // Save schedule to localStorage whenever items change
  useEffect(() => {
    if (state.isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
      } catch {
        console.error('Failed to save schedule to localStorage')
      }
    }
  }, [state.items, state.isLoaded])

  const addEvent = useCallback(
    (event: Event) => {
      // Check if event is already in schedule
      if (state.items.some((item) => item.eventId === event.id)) {
        return
      }

      const scheduleEvent: ScheduleEvent = {
        id: `schedule-${event.id}-${Date.now()}`,
        eventId: event.id,
        event,
        priority: 1, // Default priority
        addedAt: new Date(),
      }

      dispatch({ type: 'ADD_EVENT', payload: scheduleEvent })
    },
    [state.items]
  )

  const removeEvent = useCallback((eventId: string) => {
    dispatch({ type: 'REMOVE_EVENT', payload: eventId })
  }, [])

  const isInSchedule = useCallback(
    (eventId: string) => {
      return state.items.some((item) => item.eventId === eventId)
    },
    [state.items]
  )

  const updatePriority = useCallback((eventId: string, priority: number) => {
    dispatch({ type: 'UPDATE_PRIORITY', payload: { eventId, priority } })
  }, [])

  const clearSchedule = useCallback(() => {
    dispatch({ type: 'CLEAR_SCHEDULE' })
  }, [])

  const getEventCount = useCallback(() => {
    return state.items.length
  }, [state.items])

  const getConflicts = useCallback(() => {
    return state.conflicts
  }, [state.conflicts])

  const getScheduleUrl = useCallback(() => {
    const eventIds = state.items.map((item) => item.eventId)
    const encoded = btoa(JSON.stringify(eventIds))
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/schedule?share=${encoded}`
    }
    return `/schedule?share=${encoded}`
  }, [state.items])

  const value = useMemo(
    () => ({
      state,
      addEvent,
      removeEvent,
      isInSchedule,
      updatePriority,
      clearSchedule,
      getEventCount,
      getConflicts,
      getScheduleUrl,
    }),
    [
      state,
      addEvent,
      removeEvent,
      isInSchedule,
      updatePriority,
      clearSchedule,
      getEventCount,
      getConflicts,
      getScheduleUrl,
    ]
  )

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
}

export function useSchedule() {
  const context = useContext(ScheduleContext)
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider')
  }
  return context
}
