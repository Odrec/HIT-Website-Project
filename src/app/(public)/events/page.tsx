'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Calendar,
  Grid3X3,
  List,
  Search,
  Filter,
  Loader2,
  BookOpen,
  ArrowDownAZ,
} from 'lucide-react'
import { HelpLink } from '@/components/help/HelpLink'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EventCard } from '@/components/events/EventCard'
import { EventFilters } from '@/components/events/EventFilters'
import { EventCalendarView } from '@/components/events/EventCalendarView'
import { ClusterIcon } from '@/components/ui/cluster-icon'
import { trackEvent, trackSearch } from '@/lib/analytics'
import { cn } from '@/lib/utils'

type ViewMode = 'list' | 'grid' | 'calendar'
type BrowseMode = 'all' | 'cluster' | 'az'

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
    cluster?: {
      id: string
      name: string
      icon: string | null
    } | null
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

function EventsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [browseMode, setBrowseMode] = useState<BrowseMode>(
    (searchParams.get('browse') as BrowseMode) || 'all'
  )
  const [showFilters, setShowFilters] = useState(false)

  // Data state
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEvents, setTotalEvents] = useState(0)
  const [page, setPage] = useState(1)
  // Load more events for cluster/A-Z views since they group client-side
  const pageSize = browseMode === 'all' ? 12 : 200

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
      if (searchQuery) {
        trackSearch(searchQuery, 'events')
      }
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
    if (browseMode !== 'all') params.set('browse', browseMode)

    const queryString = params.toString()
    const newUrl = queryString ? `/events?${queryString}` : '/events'
    router.replace(newUrl, { scroll: false })
  }, [debouncedSearch, filters, sortBy, sortOrder, browseMode, router])

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
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-hit-gray-900">Veranstaltungen</h1>
          <HelpLink href="/hilfe/besucher#veranstaltungen" />
        </div>
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
            placeholder="Suchen nach Titel, Beschreibung, Dozent, Studiengang..."
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

      {/* Browse Mode Tabs */}
      <Tabs
        value={browseMode}
        onValueChange={(v) => {
          setBrowseMode(v as BrowseMode)
          setPage(1)
          trackEvent('navigation', 'view-switch', v)
        }}
        className="mb-4"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              <List className="h-3.5 w-3.5" />
              Alle
            </TabsTrigger>
            <TabsTrigger value="cluster" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Nach Studienfeld
            </TabsTrigger>
            <TabsTrigger value="az" className="gap-1.5">
              <ArrowDownAZ className="h-3.5 w-3.5" />
              A-Z Studiengänge
            </TabsTrigger>
          </TabsList>
          <span className="text-sm text-hit-gray-600">
            {loading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              `${totalEvents} Veranstaltung${totalEvents !== 1 ? 'en' : ''}`
            )}
          </span>
        </div>
      </Tabs>

      {hasActiveFilters && (
        <div className="mb-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Filter zurücksetzen
          </Button>
        </div>
      )}

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
      ) : browseMode === 'cluster' ? (
        <ClusterView events={events} viewMode={viewMode} />
      ) : browseMode === 'az' ? (
        <AZView events={events} viewMode={viewMode} />
      ) : viewMode === 'calendar' ? (
        <EventCalendarView events={events} />
      ) : (
        <>
          {/* Flat List/Grid View */}
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
    </>
  )
}

/**
 * Cluster view - events grouped by study program cluster
 */
function ClusterView({ events, viewMode: rawViewMode }: { events: Event[]; viewMode: ViewMode }) {
  const viewMode = rawViewMode === 'calendar' ? 'list' : rawViewMode
  // Build cluster -> events map via study programs
  const clusterMap = new Map<
    string,
    { name: string; icon: string | null; events: Map<string, Event> }
  >()
  const unclustered = new Map<string, Event>()
  const crossProgram = new Map<string, Event>()

  for (const event of events) {
    if (event.isCrossProgram) {
      crossProgram.set(event.id, event)
      continue
    }
    if (event.studyPrograms.length === 0) {
      unclustered.set(event.id, event)
      continue
    }
    let addedToCluster = false
    for (const sp of event.studyPrograms) {
      if (sp.cluster) {
        const key = sp.cluster.id
        if (!clusterMap.has(key)) {
          clusterMap.set(key, {
            name: sp.cluster.name,
            icon: sp.cluster.icon ?? null,
            events: new Map(),
          })
        }
        clusterMap.get(key)!.events.set(event.id, event)
        addedToCluster = true
      }
    }
    if (!addedToCluster) {
      unclustered.set(event.id, event)
    }
  }

  // Sort clusters alphabetically
  const sortedClusters = Array.from(clusterMap.entries()).sort((a, b) =>
    a[1].name.localeCompare(b[1].name, 'de')
  )

  return (
    <div className="space-y-6">
      {sortedClusters.map(([key, cluster]) => (
        <Card key={key}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClusterIcon icon={cluster.icon} name={cluster.name} size={24} />
              {cluster.name}
              <span className="text-sm font-normal text-hit-gray-500">
                ({cluster.events.size} Veranstaltung{cluster.events.size !== 1 ? 'en' : ''})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'flex flex-col gap-3'
              )}
            >
              {Array.from(cluster.events.values()).map((event) => (
                <EventCard key={event.id} event={event} viewMode={viewMode} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      {unclustered.size > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-hit-gray-400" />
              Weitere Veranstaltungen
              <span className="text-sm font-normal text-hit-gray-500">({unclustered.size})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'flex flex-col gap-3'
              )}
            >
              {Array.from(unclustered.values()).map((event) => (
                <EventCard key={event.id} event={event} viewMode={viewMode} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {crossProgram.size > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-hit-uni-400" />
              Studiengangsübergreifend
              <span className="text-sm font-normal text-hit-gray-500">
                ({crossProgram.size} Veranstaltung{crossProgram.size !== 1 ? 'en' : ''})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'flex flex-col gap-3'
              )}
            >
              {Array.from(crossProgram.values()).map((event) => (
                <EventCard key={event.id} event={event} viewMode={viewMode} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * A-Z view - events grouped alphabetically by study program name
 */
function AZView({ events, viewMode: rawViewMode }: { events: Event[]; viewMode: ViewMode }) {
  const viewMode = rawViewMode === 'calendar' ? 'list' : rawViewMode
  // Build letter -> study programs -> events
  const letterMap = new Map<string, Map<string, { name: string; events: Map<string, Event> }>>()
  const noProgram = new Map<string, Event>()
  const crossProgram = new Map<string, Event>()

  for (const event of events) {
    if (event.isCrossProgram) {
      crossProgram.set(event.id, event)
      continue
    }
    if (event.studyPrograms.length === 0) {
      noProgram.set(event.id, event)
      continue
    }
    for (const sp of event.studyPrograms) {
      const letter = sp.name.charAt(0).toUpperCase()
      if (!letterMap.has(letter)) {
        letterMap.set(letter, new Map())
      }
      const programsInLetter = letterMap.get(letter)!
      if (!programsInLetter.has(sp.id)) {
        programsInLetter.set(sp.id, { name: sp.name, events: new Map() })
      }
      programsInLetter.get(sp.id)!.events.set(event.id, event)
    }
  }

  const sortedLetters = Array.from(letterMap.keys()).sort((a, b) => a.localeCompare(b, 'de'))

  return (
    <div className="space-y-6">
      {/* Letter quick nav */}
      <div className="flex flex-wrap gap-1">
        {sortedLetters.map((letter) => (
          <a
            key={letter}
            href={`#letter-${letter}`}
            className="flex h-8 w-8 items-center justify-center rounded bg-hit-uni-50 text-sm font-semibold text-hit-uni-700 hover:bg-hit-uni-100"
          >
            {letter}
          </a>
        ))}
      </div>

      {sortedLetters.map((letter) => {
        const programs = Array.from(letterMap.get(letter)!.values()).sort((a, b) =>
          a.name.localeCompare(b.name, 'de')
        )
        return (
          <div key={letter} id={`letter-${letter}`}>
            <h2 className="mb-3 text-2xl font-bold text-hit-uni-600">{letter}</h2>
            <div className="space-y-4">
              {programs.map((program) => (
                <Card key={program.name}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ArrowDownAZ className="h-4 w-4 text-hit-uni-500" />
                      {program.name}
                      <span className="text-sm font-normal text-hit-gray-500">
                        ({program.events.size})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={cn(
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                          : 'flex flex-col gap-3'
                      )}
                    >
                      {Array.from(program.events.values()).map((event) => (
                        <EventCard key={event.id} event={event} viewMode={viewMode} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}

      {noProgram.size > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              Ohne Studiengangszuordnung
              <span className="text-sm font-normal text-hit-gray-500">({noProgram.size})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'flex flex-col gap-3'
              )}
            >
              {Array.from(noProgram.values()).map((event) => (
                <EventCard key={event.id} event={event} viewMode={viewMode} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {crossProgram.size > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowDownAZ className="h-4 w-4 text-hit-uni-400" />
              Studiengangsübergreifend
              <span className="text-sm font-normal text-hit-gray-500">({crossProgram.size})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'flex flex-col gap-3'
              )}
            >
              {Array.from(crossProgram.values()).map((event) => (
                <EventCard key={event.id} event={event} viewMode={viewMode} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EventsSkeleton() {
  return (
    <>
      <div className="mb-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-10 w-full lg:max-w-md" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-hit-uni-500" />
      </div>
    </>
  )
}

export default function PublicEventsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<EventsSkeleton />}>
        <EventsContent />
      </Suspense>
    </div>
  )
}
