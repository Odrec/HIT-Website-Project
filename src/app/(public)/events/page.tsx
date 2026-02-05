'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Calendar, Grid3X3, List, Search, Filter, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EventCard } from '@/components/events/EventCard'
import { EventFilters } from '@/components/events/EventFilters'
import { EventCalendarView } from '@/components/events/EventCalendarView'
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
  }>
}

interface FilterState {
  eventType: string
  institution: string
  studyProgramId: string
  timeFrom: string
  timeTo: string
}

export default function PublicEventsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showFilters, setShowFilters] = useState(false)

  // Data state
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEvents, setTotalEvents] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 12

  // Search and filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const [filters, setFilters] = useState<FilterState>({
    eventType: searchParams.get('eventType') || '',
    institution: searchParams.get('institution') || '',
    studyProgramId: searchParams.get('studyProgramId') || '',
    timeFrom: searchParams.get('timeFrom') || '',
    timeTo: searchParams.get('timeTo') || '',
  })

  // Sorting
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'timeStart')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  )

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch events
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

      const response = await fetch(`/api/events/public?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch events')

      const data = await response.json()
      setEvents(data.events)
      setTotalEvents(data.total)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, filters, sortBy, sortOrder])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (filters.eventType) params.set('eventType', filters.eventType)
    if (filters.institution) params.set('institution', filters.institution)
    if (filters.studyProgramId) params.set('studyProgramId', filters.studyProgramId)
    if (filters.timeFrom) params.set('timeFrom', filters.timeFrom)
    if (filters.timeTo) params.set('timeTo', filters.timeTo)
    if (sortBy !== 'timeStart') params.set('sortBy', sortBy)
    if (sortOrder !== 'asc') params.set('sortOrder', sortOrder)

    const queryString = params.toString()
    const newUrl = queryString ? `/events?${queryString}` : '/events'
    router.replace(newUrl, { scroll: false })
  }, [debouncedSearch, filters, sortBy, sortOrder, router])

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({
      eventType: '',
      institution: '',
      studyProgramId: '',
      timeFrom: '',
      timeTo: '',
    })
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
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-hit-gray-900">Veranstaltungen</h1>
        <p className="mt-2 text-hit-gray-600">
          Entdecken Sie alle Veranstaltungen des Hochschulinformationstags 2026
        </p>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hit-gray-400" />
          <Input
            type="text"
            placeholder="Suchen nach Titel, Beschreibung, Dozent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-4">
          {/* Filter Toggle */}
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

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border bg-white p-1">
            <button
              onClick={() => setViewMode('list')}
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
              onClick={() => setViewMode('grid')}
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
              onClick={() => setViewMode('calendar')}
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

          {/* Sort (for list/grid) */}
          {viewMode !== 'calendar' && (
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-')
                setSortBy(newSortBy)
                setSortOrder(newSortOrder as 'asc' | 'desc')
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

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6">
          <EventFilters filters={filters} onChange={handleFilterChange} onClear={clearFilters} />
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between text-sm text-hit-gray-600">
        <span>
          {loading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            `${totalEvents} Veranstaltung${totalEvents !== 1 ? 'en' : ''} gefunden`
          )}
        </span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Filter zurücksetzen
          </Button>
        )}
      </div>

      {/* Content */}
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
          {hasActiveFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Filter zurücksetzen
            </Button>
          )}
        </div>
      ) : viewMode === 'calendar' ? (
        <EventCalendarView events={events} />
      ) : (
        <>
          {/* List/Grid View */}
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col gap-4'
            )}
          >
            {events.map((event) => (
              <EventCard key={event.id} event={event} viewMode={viewMode} />
            ))}
          </div>

          {/* Pagination */}
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
    </div>
  )
}
