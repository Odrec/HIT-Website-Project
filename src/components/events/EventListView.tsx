'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Grid3X3, List, Search, Filter, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EventCard } from '@/components/events/EventCard'
import { EventFilters } from '@/components/events/EventFilters'
import { EventCalendarView } from '@/components/events/EventCalendarView'
import { trackEvent, trackSearch } from '@/lib/analytics'
import { cn } from '@/lib/utils'

type ViewMode = 'list' | 'grid' | 'calendar'

interface Event {
  id: string
  title: string
  description: string | null
  eventType: string
  timeStart: string
  timeEnd: string | null
  locationType: string
  locationDetails: string | null
  roomRequest: string | null
  meetingPoint: string | null
  additionalInfo: string | null
  photoUrl: string | null
  institution: string
  location: {
    id: string
    buildingName: string
    roomNumber: string | null
    address: string | null
  } | null
  lecturers: Array<{
    id: string
    firstName: string
    lastName: string
    title: string | null
  }>
  studyPrograms: Array<{
    id: string
    name: string
    institution: string
    clusters?: Array<{ id: string; name: string }>
  }>
  isCrossProgram?: boolean
}

interface FilterState {
  eventType: string
  institution: string
  studyProgramId: string
  timeFrom: string
  timeTo: string
}

interface EventListViewProps {
  /** Static API filters merged into every request (e.g. { clusterId: 'abc', lehramtCombined: 'true' }) */
  staticFilters?: Record<string, string>
  /** Optional initial search query (used by /events/search). */
  initialSearch?: string
  /** Optional initial view mode override. */
  initialViewMode?: ViewMode
}

export function EventListView({
  staticFilters = {},
  initialSearch = '',
  initialViewMode = 'list',
}: EventListViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [showFilters, setShowFilters] = useState(false)

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEvents, setTotalEvents] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 12

  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  const [filters, setFilters] = useState<FilterState>({
    eventType: '',
    institution: '',
    studyProgramId: '',
    timeFrom: '',
    timeTo: '',
  })

  const [sortBy, setSortBy] = useState('timeStart')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
      if (searchQuery) trackSearch(searchQuery, 'events')
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Stable serialization so callers can pass inline `staticFilters={{...}}`
  // without causing fetchEvents to be recreated every render.
  const staticFiltersKey = JSON.stringify(staticFilters)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (filters.eventType) params.set('eventType', filters.eventType)
      if (filters.institution) params.set('institution', filters.institution)
      if (filters.studyProgramId) params.set('studyProgramId', filters.studyProgramId)
      if (filters.timeFrom) params.set('timeFrom', filters.timeFrom)
      if (filters.timeTo) params.set('timeTo', filters.timeTo)
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      const parsedStatic: Record<string, string> = JSON.parse(staticFiltersKey)
      for (const [k, v] of Object.entries(parsedStatic)) params.set(k, v)

      const response = await fetch(`/api/events/public?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch events')
      const data = await response.json()
      setEvents(data.events)
      setTotalEvents(data.total)
    } catch (e) {
      console.error('Error fetching events:', e)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, filters, sortBy, sortOrder, staticFiltersKey])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const clearFilters = () => {
    setFilters({ eventType: '', institution: '', studyProgramId: '', timeFrom: '', timeTo: '' })
    setSearchQuery('')
    setPage(1)
  }

  const hasActiveFilters =
    filters.eventType ||
    filters.institution ||
    filters.studyProgramId ||
    filters.timeFrom ||
    filters.timeTo ||
    debouncedSearch

  const totalPages = Math.ceil(totalEvents / pageSize)

  return (
    <>
      {/* Search + controls */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hit-gray-400" />
          <Input
            type="text"
            placeholder="Suchen nach Titel, Beschreibung, Dozierende, Studiengang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
            {hasActiveFilters && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-hit-uni-500 text-[10px] text-white">
                !
              </span>
            )}
          </Button>

          <div className="flex rounded-lg border bg-white p-1">
            <button
              onClick={() => {
                setViewMode('list')
                trackEvent('navigation', 'view-switch', 'list')
              }}
              className={cn(
                'rounded-md p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-hit-uni-100 text-hit-uni-700'
                  : 'text-hit-gray-500 hover:text-hit-gray-700'
              )}
              aria-label="Listenansicht"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('grid')
                trackEvent('navigation', 'view-switch', 'grid')
              }}
              className={cn(
                'rounded-md p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-hit-uni-100 text-hit-uni-700'
                  : 'text-hit-gray-500 hover:text-hit-gray-700'
              )}
              aria-label="Kachelansicht"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('calendar')
                trackEvent('navigation', 'view-switch', 'calendar')
              }}
              className={cn(
                'rounded-md p-2 transition-colors',
                viewMode === 'calendar'
                  ? 'bg-hit-uni-100 text-hit-uni-700'
                  : 'text-hit-gray-500 hover:text-hit-gray-700'
              )}
              aria-label="Kalenderansicht"
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>

          {viewMode !== 'calendar' && (
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split('-')
                setSortBy(s)
                setSortOrder(o as 'asc' | 'desc')
              }}
              className="rounded-md border bg-white px-3 py-2 text-sm"
            >
              <option value="timeStart-asc">Zeit (aufsteigend)</option>
              <option value="timeStart-desc">Zeit (absteigend)</option>
              <option value="title-asc">Titel (A-Z)</option>
              <option value="title-desc">Titel (Z-A)</option>
              <option value="eventType-asc">Veranstaltungsart</option>
            </select>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="mb-6">
          <EventFilters
            filters={filters}
            onChange={(f) => {
              setFilters(f)
              setPage(1)
            }}
            onClear={clearFilters}
          />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-hit-gray-600">
          {loading ? '…' : `${totalEvents} Veranstaltung${totalEvents !== 1 ? 'en' : ''}`}
        </span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Filter zurücksetzen
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-hit-uni-500" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-hit-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-hit-gray-900">
            Keine Veranstaltungen gefunden
          </h3>
          <p className="mt-2 text-hit-gray-600">
            Versuchen Sie, Ihre Suchkriterien oder Filter anzupassen.
          </p>
        </div>
      ) : viewMode === 'calendar' ? (
        <EventCalendarView events={events} />
      ) : (
        <>
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col gap-4'
            )}
          >
            {events.map((e) => (
              <EventCard key={e.id} event={e} viewMode={viewMode} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Zurück
              </Button>
              <span className="px-4 text-sm text-hit-gray-600">
                Seite {page} von {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Weiter
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}
