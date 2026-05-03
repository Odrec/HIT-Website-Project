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
import { detectConflicts as detectConflictsGeneric } from '@/lib/schedule-conflicts'
import { DEFAULT_SCHEDULE_PRIORITY, type SchedulePriority } from '@/types/schedule'

// Types for client-side schedule management
export interface ScheduleEvent {
  id: string
  eventId: string
  event: Event
  priority: SchedulePriority
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
  | { type: 'UPDATE_PRIORITY'; payload: { eventId: string; priority: SchedulePriority } }
  | { type: 'CLEAR_SCHEDULE' }
  | { type: 'SET_CONFLICTS'; payload: TimeConflict[] }
  | { type: 'PATCH_EVENTS'; payload: Array<{ eventId: string; event: Event }> }

interface ScheduleContextType {
  state: ScheduleState
  addEvent: (event: Event) => void
  removeEvent: (eventId: string) => void
  isInSchedule: (eventId: string) => boolean
  updatePriority: (eventId: string, priority: SchedulePriority) => void
  clearSchedule: () => void
  getEventCount: () => number
  getConflicts: () => TimeConflict[]
  getScheduleUrl: () => string
}

const STORAGE_KEY = 'hit-schedule'

// Migrate older localStorage entries that stored priority as a number
// (1 = important, 2+ = less important) to the new 3-level enum.
function normalizeStoredPriority(value: unknown): SchedulePriority {
  if (value === 'HIGH' || value === 'MEDIUM' || value === 'LOW') return value
  if (typeof value === 'number') {
    if (value <= 1) return 'HIGH'
    if (value === 2) return 'MEDIUM'
    return 'LOW'
  }
  return DEFAULT_SCHEDULE_PRIORITY
}

// Detect conflicts between schedule items. Delegates to the shared detector
// in src/lib/schedule-conflicts.ts so every caller in the app — context,
// recommendation service, tests — applies the same rules (e.g. Infostände
// never conflict).
function detectConflicts(items: ScheduleEvent[]): TimeConflict[] {
  return detectConflictsGeneric(items, (item) => item.event).map((c) => ({
    event1: c.item1,
    event2: c.item2,
    overlapMinutes: c.overlapMinutes,
  }))
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
    case 'PATCH_EVENTS': {
      const patches = new Map(action.payload.map((p) => [p.eventId, p.event]))
      const newItems = state.items.map((item) => {
        const fresh = patches.get(item.eventId)
        return fresh ? { ...item, event: fresh } : item
      })
      const conflicts = detectConflicts(newItems)
      return {
        ...state,
        items: newItems,
        conflicts,
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
            priority: SchedulePriority | number
            addedAt: string
          }) => ({
            ...item,
            priority: normalizeStoredPriority(item.priority),
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

  // One-time self-healing migration: events added before the EventCard slug fix
  // were saved with `event.building.slug = ''`, which suppresses travel-time
  // warnings on the schedule timeline. On load, refetch any item whose stored
  // building lacks a slug and patch it back into state + localStorage.
  useEffect(() => {
    if (!state.isLoaded) return
    const stale = state.items.filter(
      (item) => item.event.building != null && !item.event.building.slug
    )
    if (stale.length === 0) return

    let cancelled = false
    Promise.all(
      stale.map(async (item) => {
        try {
          const res = await fetch(`/api/events/public/${item.eventId}`)
          if (!res.ok) return null
          const data = (await res.json()) as { event?: Event }
          if (!data.event) return null
          return { eventId: item.eventId, event: data.event }
        } catch {
          return null
        }
      })
    ).then((results) => {
      if (cancelled) return
      const patches = results.filter((r): r is { eventId: string; event: Event } => r !== null)
      if (patches.length > 0) dispatch({ type: 'PATCH_EVENTS', payload: patches })
    })

    return () => {
      cancelled = true
    }
    // We only want this to run on the initial load — not on every state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isLoaded])

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
        priority: DEFAULT_SCHEDULE_PRIORITY,
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

  const updatePriority = useCallback((eventId: string, priority: SchedulePriority) => {
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
