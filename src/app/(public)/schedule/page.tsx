'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  formatEventTimeRange,
  formatEventDateLong,
  formatEventDateShort,
  formatEventDateShortYear,
  formatEventDateDMY,
  formatEventDateKey,
  formatEventICalLocal,
  isSameEventDay,
} from '@/lib/event-time'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSchedule } from '@/contexts/schedule-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScheduleTimeline } from '@/components/schedule/ScheduleTimeline'
import { ScheduleEventCard } from '@/components/schedule/ScheduleEventCard'
import { RecommendationList, ScheduleAnalysis } from '@/components/recommendations'
import { TravelWarnings, RouteInfo } from '@/components/map'
import type { Route, TravelTimeAnalysis, BuildingInfo } from '@/types/routes'
import { HelpLink } from '@/components/help/HelpLink'
import {
  Calendar,
  List,
  Clock,
  Share2,
  Printer,
  Trash2,
  AlertTriangle,
  CalendarPlus,
  FileText,
  CalendarDays,
  Sparkles,
  BarChart3,
  ChevronDown,
  ChevronUp,
  MapPin,
  Navigation,
  X,
  Copy,
  Loader2,
} from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { useToast } from '@/hooks/use-toast'

// Dynamic import for map component (no SSR)
const CampusMap = dynamic(() => import('@/components/map/CampusMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
})

// Fallback HIT date used until the settings fetch resolves
// Nov 19, 2026 as a wall-clock Date (00:00 UTC components represent the
// Berlin day, for consistency with event times which are stored as wall-clock).
const FALLBACK_HIT_DATE = new Date(Date.UTC(2026, 10, 19))

function SchedulePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { state, clearSchedule, getConflicts, addEvent } = useSchedule()
  const { toast } = useToast()

  const [view, setView] = useState<'timeline' | 'list'>('timeline')
  const [selectedDate, setSelectedDate] = useState<Date>(FALLBACK_HIT_DATE)

  // Load HIT date from settings
  useEffect(() => {
    const fetchHitDate = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          if (data.hitDate) {
            // Convert to wall-clock Date (UTC components) so it compares
            // correctly against event times which are stored as wall-clock.
            const d = new Date(data.hitDate)
            setSelectedDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())))
          }
        }
      } catch (error) {
        console.error('Failed to fetch HIT date:', error)
      }
    }
    fetchHitDate()
  }, [])
  const [shareData, setShareData] = useState<{ code: string; url: string } | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [isLoadingShared, setIsLoadingShared] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(true)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showRouteMap, setShowRouteMap] = useState(false)
  const [route, setRoute] = useState<Route | null>(null)
  const [travelAnalyses, setTravelAnalyses] = useState<TravelTimeAnalysis[]>([])
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [mapLocationFilter, setMapLocationFilter] = useState<'all' | 'mine'>('all')
  const [buildings, setBuildings] = useState<BuildingInfo[]>([])

  // Check for shared schedule in URL
  useEffect(() => {
    const shareParam = searchParams.get('share')
    if (shareParam && state.isLoaded && state.items.length === 0) {
      setIsLoadingShared(true)
      try {
        const eventIds = JSON.parse(atob(shareParam)) as string[]
        // In a real implementation, we would fetch these events from the API
        // For now, we'll show a message that the shared schedule is being loaded
        toast({
          title: 'Geteilter Zeitplan',
          description: `${eventIds.length} Events werden geladen...`,
        })

        // Fetch events and add them to schedule
        fetchSharedEvents(eventIds)
      } catch {
        toast({
          variant: 'destructive',
          title: 'Fehler',
          description: 'Der geteilte Zeitplan konnte nicht geladen werden.',
        })
        setIsLoadingShared(false)
      }
    }
    // fetchSharedEvents is defined in component scope and only called from
    // inside this effect — including it would create a new reference each
    // render and retrigger the share-link import on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, state.isLoaded, state.items.length, toast])

  const fetchSharedEvents = async (eventIds: string[]) => {
    try {
      for (const id of eventIds) {
        const response = await fetch(`/api/events/public/${id}`)
        if (response.ok) {
          const data = await response.json()
          addEvent(data.event)
        }
      }
      toast({
        title: 'Zeitplan geladen',
        description: 'Der geteilte Zeitplan wurde erfolgreich geladen.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Einige Events konnten nicht geladen werden.',
      })
    } finally {
      setIsLoadingShared(false)
    }
  }

  // Fetch route and travel analysis when schedule changes
  useEffect(() => {
    const fetchRouteData = async () => {
      if (state.items.length < 2) {
        setRoute(null)
        setTravelAnalyses([])
        return
      }

      setIsLoadingRoute(true)
      try {
        const eventIds = state.items
          .filter((item) => item.event.timeStart)
          .sort(
            (a, b) =>
              new Date(a.event.timeStart!).getTime() - new Date(b.event.timeStart!).getTime()
          )
          .map((item) => item.eventId)

        if (eventIds.length < 2) {
          setRoute(null)
          setTravelAnalyses([])
          return
        }

        // Fetch route
        const routeResponse = await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduledEventIds: eventIds }),
        })
        if (routeResponse.ok) {
          const routeData = await routeResponse.json()
          setRoute(routeData)
        }

        // Fetch travel analysis
        const analysisResponse = await fetch('/api/routes/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduledEventIds: eventIds }),
        })
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json()
          setTravelAnalyses(analysisData.analyses || [])
        }
      } catch (error) {
        console.error('Failed to fetch route data:', error)
      } finally {
        setIsLoadingRoute(false)
      }
    }

    if (state.isLoaded) {
      fetchRouteData()
    }
  }, [state.items, state.isLoaded])

  // Fetch buildings for map
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await fetch('/api/routes/buildings?withEvents=false')
        if (response.ok) {
          const data = await response.json()
          setBuildings(data.buildings || [])
        }
      } catch (error) {
        console.error('Failed to fetch buildings:', error)
      }
    }
    fetchBuildings()
  }, [])

  // Get unique dates from schedule (Berlin wall-clock days, represented as
  // UTC-midnight Dates)
  const scheduleDates = useMemo(() => {
    const dates = new Set<string>()
    state.items.forEach((item) => {
      if (item.event.timeStart) {
        dates.add(formatEventDateKey(item.event.timeStart))
      }
    })
    return Array.from(dates)
      .sort()
      .map((key) => {
        const [y, m, d] = key.split('-').map(Number)
        return new Date(Date.UTC(y, m - 1, d))
      })
  }, [state.items])

  // Auto-select the first date that has events
  useEffect(() => {
    if (scheduleDates.length > 0) {
      setSelectedDate(scheduleDates[0])
    }
  }, [scheduleDates])

  // Events for selected date
  const eventsForDate = useMemo(() => {
    return state.items.filter((item) => {
      if (!item.event.timeStart) return false
      return isSameEventDay(item.event.timeStart, selectedDate)
    })
  }, [state.items, selectedDate])

  // Events without time
  const eventsWithoutTime = useMemo(() => {
    return state.items.filter((item) => !item.event.timeStart)
  }, [state.items])

  // Building IDs of scheduled events (for map highlighting)
  // Match by building name since the schedule stores location.buildingName, not buildingId
  // Uses contains-matching because event locations use short names like "Schloss" or "Caprivi Campus"
  // while BuildingInfo uses full names like "Schloss Osnabrück" or "Caprivistraße Gebäude A"
  const scheduledBuildingIds = useMemo(() => {
    const eventBuildingNames = state.items
      .map((item) => item.event.building?.name?.toLowerCase())
      .filter((n): n is string => !!n)

    if (eventBuildingNames.length === 0) return []

    return buildings
      .filter((b) => {
        const name = b.name.toLowerCase()
        const shortName = b.shortName?.toLowerCase() ?? ''
        return eventBuildingNames.some(
          (eventName) =>
            name.includes(eventName) ||
            eventName.includes(name) ||
            shortName === eventName ||
            (shortName && eventName.includes(shortName))
        )
      })
      .map((b) => b.id)
  }, [state.items, buildings])

  // Conflict check
  const conflicts = getConflicts()
  const conflictEventIds = new Set<string>()
  conflicts.forEach((c) => {
    conflictEventIds.add(c.event1.eventId)
    conflictEventIds.add(c.event2.eventId)
  })

  const handleClearSchedule = () => {
    if (confirm('Möchtest du wirklich alle Events aus deinem Zeitplan entfernen?')) {
      clearSchedule()
      toast({
        title: 'Zeitplan geleert',
        description: 'Alle Events wurden entfernt.',
      })
    }
  }

  const handleShareSchedule = async () => {
    if (state.items.length === 0) return
    setShareLoading(true)
    try {
      const eventIds = state.items.map((item) => item.eventId)
      const response = await fetch('/api/schedule/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds }),
      })
      if (!response.ok) throw new Error('Share failed')
      const data = await response.json()
      setShareData(data)
      trackEvent('schedule', 'share')
    } catch {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Fehler beim Erstellen des Links',
      })
    } finally {
      setShareLoading(false)
    }
  }

  const handlePrint = () => {
    trackEvent('schedule', 'print')
    window.print()
  }

  const handleExportIcal = () => {
    // Generate iCal content
    let ical = 'BEGIN:VCALENDAR\r\n'
    ical += 'VERSION:2.0\r\n'
    ical += 'PRODID:-//HIT Osnabrück//Zeitplan//DE\r\n'
    ical += 'CALSCALE:GREGORIAN\r\n'
    ical += 'METHOD:PUBLISH\r\n'
    ical += 'X-WR-CALNAME:HIT 2026 Zeitplan\r\n'

    state.items.forEach((item) => {
      if (item.event.timeStart && item.event.timeEnd) {
        const now = new Date()
        const dtstamp =
          now.getUTCFullYear().toString() +
          (now.getUTCMonth() + 1).toString().padStart(2, '0') +
          now.getUTCDate().toString().padStart(2, '0') +
          'T' +
          now.getUTCHours().toString().padStart(2, '0') +
          now.getUTCMinutes().toString().padStart(2, '0') +
          now.getUTCSeconds().toString().padStart(2, '0') +
          'Z'

        ical += 'BEGIN:VEVENT\r\n'
        ical += `UID:${item.event.id}@hit-osnabrueck.de\r\n`
        ical += `DTSTAMP:${dtstamp}\r\n`
        ical += `DTSTART;TZID=Europe/Berlin:${formatEventICalLocal(item.event.timeStart)}\r\n`
        ical += `DTEND;TZID=Europe/Berlin:${formatEventICalLocal(item.event.timeEnd)}\r\n`
        ical += `SUMMARY:${item.event.title}\r\n`
        if (item.event.description) {
          ical += `DESCRIPTION:${item.event.description.replace(/\n/g, '\\n')}\r\n`
        }
        if (item.event.building) {
          ical += `LOCATION:${item.event.building.name}${item.event.room?.name ? `, ${item.event.room.name}` : ''}\r\n`
        }
        ical += 'END:VEVENT\r\n'
      }
    })

    ical += 'END:VCALENDAR\r\n'

    // Download file
    const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'hit-2026-zeitplan.ics'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    trackEvent('schedule', 'export-calendar')

    toast({
      title: 'Kalender exportiert',
      description: 'Dein Zeitplan wurde als iCal-Datei exportiert.',
    })
  }

  if (!state.isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Mein Zeitplan
            </h1>
            <HelpLink href="/hilfe/besucher#stundenplan" />
          </div>
          <p className="text-muted-foreground mt-1">
            {state.items.length > 0
              ? `${state.items.length} Event${state.items.length !== 1 ? 's' : ''} geplant`
              : 'Noch keine Events geplant'}
          </p>
        </div>

        {state.items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareSchedule}
              disabled={shareLoading}
            >
              {shareLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Teilen
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportIcal}>
              <CalendarDays className="h-4 w-4 mr-2" />
              iCal Export
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
              <Printer className="h-4 w-4 mr-2" />
              Drucken
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSchedule}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Leeren
            </Button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {state.items.length === 0 && !isLoadingShared && (
        <Card className="text-center py-16">
          <CardContent>
            <CalendarPlus className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Dein Zeitplan ist leer</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Durchsuche die Events und füge sie zu deinem persönlichen Zeitplan hinzu, um deinen
              HIT-Tag zu planen.
            </p>
            <Button asChild>
              <Link href="/events">
                <Calendar className="h-4 w-4 mr-2" />
                Events durchsuchen
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Schedule content */}
      {state.items.length > 0 && (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Date selector (sidebar on desktop) */}
          <div className="lg:col-span-1 print:hidden">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Datum auswählen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scheduleDates.length > 0 ? (
                    scheduleDates.map((date) => {
                      const dateEvents = state.items.filter(
                        (item) => item.event.timeStart && isSameEventDay(item.event.timeStart, date)
                      )
                      const hasConflicts = dateEvents.some((e) => conflictEventIds.has(e.eventId))

                      return (
                        <Button
                          key={date.toISOString()}
                          variant={isSameEventDay(date, selectedDate) ? 'default' : 'outline'}
                          className="w-full justify-between"
                          onClick={() => setSelectedDate(date)}
                        >
                          <span>{formatEventDateShort(date)}</span>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {dateEvents.length}
                            </Badge>
                            {hasConflicts && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          </div>
                        </Button>
                      )
                    })
                  ) : (
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => setSelectedDate(selectedDate)}
                    >
                      {formatEventDateShortYear(selectedDate)}
                    </Button>
                  )}
                </div>

                {eventsWithoutTime.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Ohne feste Zeit:</span>
                      <span className="ml-2">{eventsWithoutTime.length} Events</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Übersicht
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gesamt Events</span>
                  <span className="font-medium">{state.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zeitkonflikte</span>
                  <span className={cn('font-medium', conflicts.length > 0 && 'text-yellow-600')}>
                    {conflicts.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verschiedene Tage</span>
                  <span className="font-medium">{scheduleDates.length || 1}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {/* View toggle */}
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h2 className="text-xl font-semibold">{formatEventDateLong(selectedDate)}</h2>
              <Tabs value={view} onValueChange={(v) => setView(v as 'timeline' | 'list')}>
                <TabsList>
                  <TabsTrigger value="timeline">
                    <Clock className="h-4 w-4 mr-2" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4 mr-2" />
                    Liste
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content */}
            {view === 'timeline' ? (
              <Card>
                <CardContent className="p-4">
                  <ScheduleTimeline selectedDate={selectedDate} showControls />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {eventsForDate.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      Keine Events für diesen Tag geplant
                    </CardContent>
                  </Card>
                ) : (
                  eventsForDate
                    .sort((a, b) => {
                      if (!a.event.timeStart) return 1
                      if (!b.event.timeStart) return -1
                      return (
                        new Date(a.event.timeStart).getTime() -
                        new Date(b.event.timeStart).getTime()
                      )
                    })
                    .map((item) => (
                      <ScheduleEventCard
                        key={item.id}
                        scheduleEvent={item}
                        hasConflict={conflictEventIds.has(item.eventId)}
                      />
                    ))
                )}
              </div>
            )}

            {/* Events without time */}
            {eventsWithoutTime.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Events ohne feste Zeit
                </h3>
                <div className="space-y-4">
                  {eventsWithoutTime.map((item) => (
                    <ScheduleEventCard key={item.id} scheduleEvent={item} hasConflict={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      <div className="mt-12 print:hidden">
        {/* Analysis Toggle */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Button
            variant={showRouteMap ? 'default' : 'outline'}
            onClick={() => setShowRouteMap(!showRouteMap)}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Routenplanung
            {travelAnalyses.filter((a) => a.status !== 'ok').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {travelAnalyses.filter((a) => a.status !== 'ok').length}
              </Badge>
            )}
            {showRouteMap ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
          <Button
            variant={showAnalysis ? 'default' : 'outline'}
            onClick={() => setShowAnalysis(!showAnalysis)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Zeitplan-Analyse
            {showAnalysis ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
          <Button
            variant={showRecommendations ? 'default' : 'outline'}
            onClick={() => setShowRecommendations(!showRecommendations)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Empfehlungen
            {showRecommendations ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        </div>

        {/* Route Map and Travel Warnings */}
        {showRouteMap && state.items.length > 0 && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-primary" />
                  Route zwischen Veranstaltungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRoute ? (
                  <Skeleton className="h-[400px] w-full rounded-lg" />
                ) : (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Map */}
                    <div>
                      {/* Location filter toggle */}
                      <div className="flex justify-end mb-2">
                        <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm">
                          <button
                            className={cn(
                              'px-3 py-1.5 font-medium transition-colors',
                              mapLocationFilter === 'all'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background text-muted-foreground hover:bg-muted'
                            )}
                            onClick={() => setMapLocationFilter('all')}
                          >
                            Alle Orte
                          </button>
                          <button
                            className={cn(
                              'px-3 py-1.5 font-medium transition-colors',
                              mapLocationFilter === 'mine'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background text-muted-foreground hover:bg-muted'
                            )}
                            onClick={() => setMapLocationFilter('mine')}
                          >
                            Meine Orte
                          </button>
                        </div>
                      </div>
                      <CampusMap
                        buildings={buildings}
                        route={route || undefined}
                        travelAnalyses={travelAnalyses}
                        showAllBuildings={true}
                        showRoute={true}
                        height="400px"
                        className="rounded-lg overflow-hidden"
                        highlightBuildingIds={scheduledBuildingIds}
                        dimUnselected={mapLocationFilter === 'mine'}
                      />
                    </div>
                    {/* Route Info and Warnings */}
                    <div className="space-y-4">
                      <RouteInfo route={route} />
                      <TravelWarnings
                        analyses={travelAnalyses}
                        onEventClick={(eventId: string) => {
                          router.push(`/events/${eventId}`)
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button asChild variant="outline">
                    <Link href="/route-planner">
                      <MapPin className="h-4 w-4 mr-2" />
                      Detaillierte Routenplanung
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Schedule Analysis */}
        {showAnalysis && state.items.length > 0 && (
          <div className="mb-8">
            <ScheduleAnalysis />
          </div>
        )}

        {/* Personalized Recommendations */}
        {showRecommendations && (
          <RecommendationList showFilters={true} showGroups={true} limit={12} />
        )}
      </div>

      {/* Share Modal */}
      {shareData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl p-6 mx-4 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Zeitplan teilen</h3>
              <Button variant="ghost" size="sm" onClick={() => setShareData(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={shareData.url} size={200} level="M" marginSize={2} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={shareData.url}
                className="flex-1 text-sm border rounded px-3 py-2 bg-gray-50"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(shareData.url)
                  toast({
                    title: 'Link kopiert!',
                  })
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">QR-Code scannen oder Link teilen</p>
          </div>
        </div>
      )}

      {/* Print-only full schedule */}
      <div className="hidden print:block print-schedule">
        <div className="text-center mb-6 pb-3 border-b-2 border-black">
          <h2 className="text-xl font-bold m-0">Mein HIT 2026 Zeitplan</h2>
          <p className="text-sm text-gray-600 m-0">
            Hochschulinformationstag &mdash;{' '}
            {selectedDate ? formatEventDateDMY(selectedDate) : '19. November 2026'}
          </p>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-1.5 px-2 font-semibold w-[15%]">Zeit</th>
              <th className="text-left py-1.5 px-2 font-semibold w-[35%]">Veranstaltung</th>
              <th className="text-left py-1.5 px-2 font-semibold w-[15%]">Typ</th>
              <th className="text-left py-1.5 px-2 font-semibold w-[20%]">Ort</th>
              <th className="text-left py-1.5 px-2 font-semibold w-[15%]">Raum</th>
            </tr>
          </thead>
          <tbody>
            {state.items
              .sort((a, b) => {
                if (!a.event.timeStart) return 1
                if (!b.event.timeStart) return -1
                return new Date(a.event.timeStart).getTime() - new Date(b.event.timeStart).getTime()
              })
              .map((item, index) => (
                <tr
                  key={item.id}
                  className={index % 2 === 1 ? 'bg-gray-50' : ''}
                  style={{ borderBottom: '1px solid #ddd' }}
                >
                  <td className="py-2 px-2 whitespace-nowrap">
                    {item.event.timeStart
                      ? formatEventTimeRange(item.event.timeStart, item.event.timeEnd)
                      : '—'}
                  </td>
                  <td className="py-2 px-2 font-medium">{item.event.title}</td>
                  <td className="py-2 px-2 text-gray-600">
                    {item.event.eventType
                      ?.replace('_', ' ')
                      .toLowerCase()
                      .replace(/^\w/, (c: string) => c.toUpperCase()) ?? '—'}
                  </td>
                  <td className="py-2 px-2">{item.event.building?.name ?? '—'}</td>
                  <td className="py-2 px-2">{item.event.room?.name ?? '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="mt-5 pt-2.5 border-t border-gray-300 text-xs text-gray-500 flex justify-between">
          <span>{state.items.length} Veranstaltungen</span>
          <span>hit.zsb-os.de</span>
        </div>
      </div>
    </div>
  )
}

export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      }
    >
      <SchedulePageContent />
    </Suspense>
  )
}
