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
  watchlist: ScheduleEvent[]
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
  | { type: 'PRUNE_MISSING'; payload: string[] }
  | { type: 'LOAD_WATCHLIST'; payload: ScheduleEvent[] }
  | { type: 'ADD_WATCHLIST'; payload: ScheduleEvent }
  | { type: 'REMOVE_WATCHLIST'; payload: string }
  | { type: 'CLEAR_WATCHLIST' }

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
  addToWatchlist: (event: Event) => void
  removeFromWatchlist: (eventId: string) => void
  isInWatchlist: (eventId: string) => boolean
  getWatchlistCount: () => number
  clearWatchlist: () => void
}

const STORAGE_KEY = 'hit-schedule'
const WATCHLIST_STORAGE_KEY = 'hit-watchlist'

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

// Restore a stored array of schedule/watchlist entries: JSON dates → Date,
// legacy numeric priority → enum. Shared by both the schedule and watchlist
// load effects so the deserialization lives in one place.
function reviveScheduleEvents(parsed: unknown): ScheduleEvent[] {
  if (!Array.isArray(parsed)) return []
  return parsed.map(
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

export function scheduleReducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
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
        watchlist: state.watchlist.filter((w) => w.eventId !== action.payload.eventId),
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
    case 'PRUNE_MISSING': {
      const missing = new Set(action.payload)
      const newItems = state.items.filter((item) => !missing.has(item.eventId))
      const newWatchlist = state.watchlist.filter((w) => !missing.has(w.eventId))
      return {
        ...state,
        items: newItems,
        conflicts: detectConflicts(newItems),
        watchlist: newWatchlist,
      }
    }
    case 'LOAD_WATCHLIST': {
      return {
        ...state,
        watchlist: action.payload,
      }
    }
    case 'ADD_WATCHLIST': {
      // Mutual exclusivity: an event lives in at most one list.
      const newItems = state.items.filter((item) => item.eventId !== action.payload.eventId)
      const alreadyWatched = state.watchlist.some((w) => w.eventId === action.payload.eventId)
      return {
        ...state,
        items: newItems,
        conflicts: detectConflicts(newItems),
        watchlist: alreadyWatched ? state.watchlist : [...state.watchlist, action.payload],
      }
    }
    case 'REMOVE_WATCHLIST': {
      return {
        ...state,
        watchlist: state.watchlist.filter((w) => w.eventId !== action.payload),
      }
    }
    case 'CLEAR_WATCHLIST': {
      return {
        ...state,
        watchlist: [],
      }
    }
    default:
      return state
  }
}

export const initialState: ScheduleState = {
  items: [],
  conflicts: [],
  watchlist: [],
  isLoaded: false,
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined)

interface ScheduleProviderProps {
  children: React.ReactNode
}

export function ScheduleProvider({ children }: ScheduleProviderProps) {
  const [state, dispatch] = useReducer(scheduleReducer, initialState)

  // Load schedule + watchlist from localStorage on mount.
  useEffect(() => {
    try {
      const storedWatch = localStorage.getItem(WATCHLIST_STORAGE_KEY)
      dispatch({
        type: 'LOAD_WATCHLIST',
        payload: storedWatch ? reviveScheduleEvents(JSON.parse(storedWatch)) : [],
      })
    } catch {
      console.error('Failed to load watchlist from localStorage')
      dispatch({ type: 'LOAD_WATCHLIST', payload: [] })
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      dispatch({
        type: 'LOAD_SCHEDULE',
        payload: stored ? reviveScheduleEvents(JSON.parse(stored)) : [],
      })
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

  // Persist watchlist whenever it changes.
  useEffect(() => {
    if (state.isLoaded) {
      try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(state.watchlist))
      } catch {
        console.error('Failed to save watchlist to localStorage')
      }
    }
  }, [state.watchlist, state.isLoaded])

  // On load, reconcile every stored schedule + watchlist item against the
  // public API (active edition, PUBLISHED only):
  //  - 200  → patch the stored event with fresh data. This also self-heals
  //           events saved before the EventCard slug fix (building.slug = ''),
  //           which previously suppressed travel-time warnings.
  //  - 404  → the event is no longer published in the active edition (e.g. it
  //           was rolled over and now sits only in the Prüfstand, or belongs to
  //           an archived edition). Prune it so stale prior-year entries don't
  //           linger in the Stundenplan/Merkliste and confuse returning visitors.
  //  - other (network error, 5xx) → leave untouched; never prune on a transient
  //           failure.
  // Shared cross-edition schedules at /s/[code] are server-rendered and do not
  // use this localStorage state, so they are unaffected.
  useEffect(() => {
    if (!state.isLoaded) return
    const idsToCheck = Array.from(
      new Set([...state.items, ...state.watchlist].map((item) => item.eventId))
    )
    if (idsToCheck.length === 0) return

    let cancelled = false
    Promise.all(
      idsToCheck.map(async (eventId) => {
        try {
          const res = await fetch(`/api/events/public/${eventId}`)
          if (res.status === 404) {
            return { eventId, status: 'missing' as const }
          }
          if (!res.ok) return { eventId, status: 'skip' as const }
          const data = (await res.json()) as { event?: Event }
          if (!data.event) return { eventId, status: 'skip' as const }
          return { eventId, status: 'ok' as const, event: data.event }
        } catch {
          return { eventId, status: 'skip' as const }
        }
      })
    ).then((results) => {
      if (cancelled) return
      const patches = results
        .filter((r): r is { eventId: string; status: 'ok'; event: Event } => r.status === 'ok')
        .map(({ eventId, event }) => ({ eventId, event }))
      const missing = results.filter((r) => r.status === 'missing').map((r) => r.eventId)
      if (patches.length > 0) dispatch({ type: 'PATCH_EVENTS', payload: patches })
      if (missing.length > 0) dispatch({ type: 'PRUNE_MISSING', payload: missing })
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

  const addToWatchlist = useCallback(
    (event: Event) => {
      if (state.watchlist.some((w) => w.eventId === event.id)) return
      const watchEvent: ScheduleEvent = {
        id: `watch-${event.id}-${Date.now()}`,
        eventId: event.id,
        event,
        priority: DEFAULT_SCHEDULE_PRIORITY,
        addedAt: new Date(),
      }
      dispatch({ type: 'ADD_WATCHLIST', payload: watchEvent })
    },
    [state.watchlist]
  )

  const removeFromWatchlist = useCallback((eventId: string) => {
    dispatch({ type: 'REMOVE_WATCHLIST', payload: eventId })
  }, [])

  const isInWatchlist = useCallback(
    (eventId: string) => state.watchlist.some((w) => w.eventId === eventId),
    [state.watchlist]
  )

  const getWatchlistCount = useCallback(() => state.watchlist.length, [state.watchlist])

  const clearWatchlist = useCallback(() => {
    dispatch({ type: 'CLEAR_WATCHLIST' })
  }, [])

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
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      getWatchlistCount,
      clearWatchlist,
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
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      getWatchlistCount,
      clearWatchlist,
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
