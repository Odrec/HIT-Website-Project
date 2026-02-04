'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { format, addDays, startOfDay, isSameDay, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSchedule } from '@/contexts/schedule-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScheduleTimeline } from '@/components/schedule/ScheduleTimeline'
import { ScheduleEventCard } from '@/components/schedule/ScheduleEventCard'
import { RecommendationList, ScheduleAnalysis } from '@/components/recommendations'
import { TravelWarnings, RouteInfo } from '@/components/map'
import type { Route, TravelTimeAnalysis, BuildingInfo } from '@/types/routes'
import {
  Calendar,
  List,
  Clock,
  Download,
  Share2,
  Printer,
  Trash2,
  AlertTriangle,
  CalendarPlus,
  Copy,
  Check,
  FileText,
  CalendarDays,
  Sparkles,
  BarChart3,
  ChevronDown,
  ChevronUp,
  MapPin,
  Navigation,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Dynamic import for map component (no SSR)
const CampusMap = dynamic(() => import('@/components/map/CampusMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
})

// HIT Event date (typically November 2026)
const HIT_DATE = new Date('2026-11-14')

function SchedulePageContent() {
  const searchParams = useSearchParams()
  const { state, clearSchedule, getConflicts, getScheduleUrl, addEvent } = useSchedule()
  const { toast } = useToast()
  
  const [view, setView] = useState<'timeline' | 'list'>('timeline')
  const [selectedDate, setSelectedDate] = useState<Date>(HIT_DATE)
  const [copied, setCopied] = useState(false)
  const [isLoadingShared, setIsLoadingShared] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(true)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showRouteMap, setShowRouteMap] = useState(false)
  const [route, setRoute] = useState<Route | null>(null)
  const [travelAnalyses, setTravelAnalyses] = useState<TravelTimeAnalysis[]>([])
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)

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
          .sort((a, b) =>
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

  // Get unique dates from schedule
  const scheduleDates = useMemo(() => {
    const dates = new Set<string>()
    state.items.forEach((item) => {
      if (item.event.timeStart) {
        const dateStr = format(new Date(item.event.timeStart), 'yyyy-MM-dd')
        dates.add(dateStr)
      }
    })
    return Array.from(dates)
      .map((d) => parseISO(d))
      .sort((a, b) => a.getTime() - b.getTime())
  }, [state.items])

  // Events for selected date
  const eventsForDate = useMemo(() => {
    return state.items.filter((item) => {
      if (!item.event.timeStart) return false
      return isSameDay(new Date(item.event.timeStart), selectedDate)
    })
  }, [state.items, selectedDate])

  // Events without time
  const eventsWithoutTime = useMemo(() => {
    return state.items.filter((item) => !item.event.timeStart)
  }, [state.items])

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
    const url = getScheduleUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({
        title: 'Link kopiert',
        description: 'Der Link zu deinem Zeitplan wurde kopiert.',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Der Link konnte nicht kopiert werden.',
      })
    }
  }

  const handlePrint = () => {
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
        const startDate = new Date(item.event.timeStart)
        const endDate = new Date(item.event.timeEnd)
        
        ical += 'BEGIN:VEVENT\r\n'
        ical += `UID:${item.event.id}@hit-osnabrueck.de\r\n`
        ical += `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}\r\n`
        ical += `DTSTART:${format(startDate, "yyyyMMdd'T'HHmmss")}\r\n`
        ical += `DTEND:${format(endDate, "yyyyMMdd'T'HHmmss")}\r\n`
        ical += `SUMMARY:${item.event.title}\r\n`
        if (item.event.description) {
          ical += `DESCRIPTION:${item.event.description.replace(/\n/g, '\\n')}\r\n`
        }
        if (item.event.location) {
          ical += `LOCATION:${item.event.location.buildingName}${item.event.location.roomNumber ? `, ${item.event.location.roomNumber}` : ''}\r\n`
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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Mein Zeitplan
          </h1>
          <p className="text-muted-foreground mt-1">
            {state.items.length > 0
              ? `${state.items.length} Event${state.items.length !== 1 ? 's' : ''} geplant`
              : 'Noch keine Events geplant'}
          </p>
        </div>

        {state.items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleShareSchedule}>
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Kopiert!' : 'Teilen'}
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
              Durchsuche die Events und füge sie zu deinem persönlichen Zeitplan hinzu,
              um deinen HIT-Tag zu planen.
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
                        (item) =>
                          item.event.timeStart &&
                          isSameDay(new Date(item.event.timeStart), date)
                      )
                      const hasConflicts = dateEvents.some((e) =>
                        conflictEventIds.has(e.eventId)
                      )

                      return (
                        <Button
                          key={date.toISOString()}
                          variant={isSameDay(date, selectedDate) ? 'default' : 'outline'}
                          className="w-full justify-between"
                          onClick={() => setSelectedDate(date)}
                        >
                          <span>{format(date, 'EEE, d. MMM', { locale: de })}</span>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {dateEvents.length}
                            </Badge>
                            {hasConflicts && (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </Button>
                      )
                    })
                  ) : (
                    <Button
                      variant={isSameDay(HIT_DATE, selectedDate) ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setSelectedDate(HIT_DATE)}
                    >
                      {format(HIT_DATE, 'EEE, d. MMM yyyy', { locale: de })}
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
              <h2 className="text-xl font-semibold">
                {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}
              </h2>
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
                    <ScheduleEventCard
                      key={item.id}
                      scheduleEvent={item}
                      hasConflict={false}
                    />
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
            {showRouteMap ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
          <Button
            variant={showAnalysis ? 'default' : 'outline'}
            onClick={() => setShowAnalysis(!showAnalysis)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Zeitplan-Analyse
            {showAnalysis ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
          <Button
            variant={showRecommendations ? 'default' : 'outline'}
            onClick={() => setShowRecommendations(!showRecommendations)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Empfehlungen
            {showRecommendations ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
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
                      <CampusMap
                        route={route || undefined}
                        showAllBuildings={false}
                        showRoute={true}
                        height="400px"
                        className="rounded-lg overflow-hidden"
                      />
                    </div>
                    {/* Route Info and Warnings */}
                    <div className="space-y-4">
                      <RouteInfo route={route} />
                      <TravelWarnings
                        analyses={travelAnalyses}
                        onEventClick={(eventId: string) => {
                          // Could scroll to event or open detail
                          console.log('Clicked event:', eventId)
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
          <RecommendationList
            showFilters={true}
            showGroups={true}
            limit={12}
          />
        )}
      </div>

      {/* Print-only full schedule */}
      <div className="hidden print:block mt-8">
        <h2 className="text-xl font-bold mb-4">
          HIT 2026 - Mein Zeitplan
        </h2>
        {state.items
          .sort((a, b) => {
            if (!a.event.timeStart) return 1
            if (!b.event.timeStart) return -1
            return (
              new Date(a.event.timeStart).getTime() -
              new Date(b.event.timeStart).getTime()
            )
          })
          .map((item) => (
            <div key={item.id} className="mb-4 pb-4 border-b">
              <div className="font-medium">{item.event.title}</div>
              {item.event.timeStart && (
                <div className="text-sm text-gray-600">
                  {format(new Date(item.event.timeStart), 'EEEE, d. MMMM yyyy, HH:mm', {
                    locale: de,
                  })}
                  {item.event.timeEnd && (
                    <> - {format(new Date(item.event.timeEnd), 'HH:mm')}</>
                  )}
                </div>
              )}
              {item.event.location && (
                <div className="text-sm text-gray-600">
                  {item.event.location.buildingName}
                  {item.event.location.roomNumber && `, ${item.event.location.roomNumber}`}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}

export default function SchedulePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    }>
      <SchedulePageContent />
    </Suspense>
  )
}
