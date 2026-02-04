'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSchedule } from '@/contexts/schedule-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TravelWarnings, RouteInfo } from '@/components/map'
import type {
  Route,
  TravelTimeAnalysis,
  BuildingInfo,
  WalkingSpeed,
  CampusArea,
} from '@/types/routes'
import {
  MapPin,
  Navigation,
  Calendar,
  Clock,
  Footprints,
  AlertTriangle,
  Building2,
  Info,
  Settings,
  RotateCcw,
  List,
  Map as MapIcon,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

// Dynamic import for map component (no SSR)
const CampusMap = dynamic(() => import('@/components/map/CampusMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full rounded-lg" />,
})

// Campus areas for filtering
const CAMPUS_AREAS: { id: string; name: string }[] = [
  { id: 'all', name: 'Alle Standorte' },
  { id: 'schloss', name: 'Schloss Campus' },
  { id: 'westerberg', name: 'Westerberg Campus' },
  { id: 'caprivi', name: 'Caprivi (Hochschule)' },
  { id: 'haste', name: 'Haste (Hochschule)' },
]

export default function RoutePlannerPage() {
  const { state } = useSchedule()
  
  const [view, setView] = useState<'map' | 'list'>('map')
  const [selectedCampus, setSelectedCampus] = useState('all')
  const [walkingSpeed, setWalkingSpeed] = useState<WalkingSpeed>('normal')
  const [buildings, setBuildings] = useState<BuildingInfo[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null)
  const [route, setRoute] = useState<Route | null>(null)
  const [travelAnalyses, setTravelAnalyses] = useState<TravelTimeAnalysis[]>([])
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)

  // Fetch buildings
  useEffect(() => {
    const fetchBuildings = async () => {
      setIsLoadingBuildings(true)
      try {
        const response = await fetch(`/api/routes/buildings?withEvents=false`)
        if (response.ok) {
          const data = await response.json()
          setBuildings(data.buildings || [])
        }
      } catch (error) {
        console.error('Failed to fetch buildings:', error)
      } finally {
        setIsLoadingBuildings(false)
      }
    }
    fetchBuildings()
  }, [])

  // Fetch route when schedule changes
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
              new Date(a.event.timeStart!).getTime() -
              new Date(b.event.timeStart!).getTime()
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
          body: JSON.stringify({
            scheduledEventIds: eventIds,
            settings: { walkingSpeed },
          }),
        })
        if (routeResponse.ok) {
          const routeData = await routeResponse.json()
          setRoute(routeData)
        }

        // Fetch travel analysis
        const analysisResponse = await fetch('/api/routes/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledEventIds: eventIds,
            settings: { walkingSpeed },
          }),
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
  }, [state.items, state.isLoaded, walkingSpeed])

  // Filter buildings by campus
  const filteredBuildings = useMemo(() => {
    if (selectedCampus === 'all') return buildings
    return buildings.filter((b) => b.campus === selectedCampus)
  }, [buildings, selectedCampus])

  // Count warnings
  const warningCount = travelAnalyses.filter((a) => a.status !== 'ok').length

  const handleBuildingClick = (building: BuildingInfo) => {
    setSelectedBuilding(building)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60)
    if (mins < 60) return `${mins} Min.`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Navigation className="h-8 w-8 text-primary" />
            Routenplanung
          </h1>
          <p className="text-muted-foreground mt-1">
            Planen Sie Ihren Weg zwischen den Veranstaltungen
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Walking speed selector */}
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <Select
              value={walkingSpeed}
              onValueChange={(v) => setWalkingSpeed(v as WalkingSpeed)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Gehgeschwindigkeit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Langsam</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="fast">Schnell</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View toggle */}
          <Tabs value={view} onValueChange={(v) => setView(v as 'map' | 'list')}>
            <TabsList>
              <TabsTrigger value="map">
                <MapIcon className="h-4 w-4 mr-2" />
                Karte
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
                Liste
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left sidebar - Schedule route */}
        <div className="lg:col-span-1 space-y-6">
          {/* Schedule route card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Mein Zeitplan
                {warningCount > 0 && (
                  <Badge variant="destructive">{warningCount} Warnung(en)</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {state.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Ihr Zeitplan ist leer.</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link href="/events">
                      Events durchsuchen
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Route info */}
                  {isLoadingRoute ? (
                    <Skeleton className="h-24 w-full" />
                  ) : route ? (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">
                            {route.waypoints.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Stationen
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {formatDistance(route.totalDistance)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Gesamt
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {formatDuration(route.totalDuration)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Gehzeit
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Schedule events list */}
                  <div className="space-y-2">
                    {state.items
                      .filter((item) => item.event.timeStart)
                      .sort(
                        (a, b) =>
                          new Date(a.event.timeStart!).getTime() -
                          new Date(b.event.timeStart!).getTime()
                      )
                      .map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                        >
                          <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {item.event.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(item.event.timeStart!).toLocaleTimeString(
                                'de-DE',
                                { hour: '2-digit', minute: '2-digit' }
                              )}
                              {item.event.location && (
                                <>
                                  <span>•</span>
                                  <MapPin className="h-3 w-3" />
                                  {item.event.location.buildingName}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  <Separator />

                  <Button asChild variant="outline" className="w-full">
                    <Link href="/schedule">
                      <Calendar className="h-4 w-4 mr-2" />
                      Zeitplan bearbeiten
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Travel warnings */}
          {travelAnalyses.length > 0 && (
            <TravelWarnings
              analyses={travelAnalyses}
              onEventClick={(eventId: string) => {
                console.log('Navigate to event:', eventId)
              }}
            />
          )}
        </div>

        {/* Main content area - Map or List */}
        <div className="lg:col-span-2">
          {view === 'map' ? (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapIcon className="h-5 w-5" />
                    Campus Karte
                  </CardTitle>
                  {/* Campus filter */}
                  <Select
                    value={selectedCampus}
                    onValueChange={setSelectedCampus}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Campus auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPUS_AREAS.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingBuildings ? (
                  <Skeleton className="h-[500px] w-full rounded-lg" />
                ) : (
                  <CampusMap
                    buildings={filteredBuildings}
                    route={route || undefined}
                    selectedBuilding={selectedBuilding?.id}
                    onBuildingClick={handleBuildingClick}
                    showAllBuildings={true}
                    showRoute={state.items.length >= 2}
                    height="500px"
                    className="rounded-lg overflow-hidden"
                  />
                )}

                {/* Selected building info */}
                {selectedBuilding && (
                  <Card className="mt-4 bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">
                            {selectedBuilding.name}
                          </h3>
                          {selectedBuilding.shortName && (
                            <p className="text-sm text-muted-foreground">
                              ({selectedBuilding.shortName})
                            </p>
                          )}
                          <p className="text-sm mt-2">
                            {selectedBuilding.address}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge
                              variant="secondary"
                              className={
                                selectedBuilding.campus === 'schloss'
                                  ? 'bg-purple-100 text-purple-800'
                                  : selectedBuilding.campus === 'westerberg'
                                  ? 'bg-blue-100 text-blue-800'
                                  : selectedBuilding.campus === 'caprivi'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-orange-100 text-orange-800'
                              }
                            >
                              {CAMPUS_AREAS.find(
                                (c) => c.id === selectedBuilding.campus
                              )?.name || selectedBuilding.campus}
                            </Badge>
                            {selectedBuilding.hasAccessibility && (
                              <span
                                className="text-green-600"
                                title="Barrierefrei"
                              >
                                ♿ Barrierefrei
                              </span>
                            )}
                          </div>
                          {selectedBuilding.accessibilityNotes && (
                            <p className="text-sm text-orange-600 mt-2">
                              ⚠️ {selectedBuilding.accessibilityNotes}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedBuilding(null)}
                        >
                          ✕
                        </Button>
                      </div>
                      {selectedBuilding.eventCount !== undefined &&
                        selectedBuilding.eventCount > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              <strong>{selectedBuilding.eventCount}</strong>{' '}
                              Veranstaltung(en) an diesem Standort
                            </p>
                            <Button
                              asChild
                              variant="link"
                              className="p-0 h-auto mt-1"
                            >
                              <Link
                                href={`/events?building=${selectedBuilding.name}`}
                              >
                                Events anzeigen
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          ) : (
            /* List view */
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Gebäudeliste
                  </CardTitle>
                  <Select
                    value={selectedCampus}
                    onValueChange={setSelectedCampus}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Campus auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPUS_AREAS.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingBuildings ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Group by campus */}
                    {Object.entries(
                      filteredBuildings.reduce((acc, building) => {
                        const campus = building.campus || 'other'
                        if (!acc[campus]) acc[campus] = []
                        acc[campus].push(building)
                        return acc
                      }, {} as Record<string, BuildingInfo[]>)
                    ).map(([campus, campusBuildings]) => (
                      <div key={campus}>
                        <h3 className="font-semibold text-lg mb-3">
                          {CAMPUS_AREAS.find((c) => c.id === campus)?.name ||
                            campus}
                        </h3>
                        <div className="space-y-2">
                          {campusBuildings.map((building) => (
                            <div
                              key={building.id}
                              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => {
                                setSelectedBuilding(building)
                                setView('map')
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium">
                                    {building.name}
                                    {building.shortName && (
                                      <span className="text-muted-foreground ml-2">
                                        ({building.shortName})
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {building.address}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    {building.hasAccessibility && (
                                      <span className="text-green-600 text-sm">
                                        ♿
                                      </span>
                                    )}
                                    {building.eventCount !== undefined &&
                                      building.eventCount > 0 && (
                                        <Badge variant="secondary">
                                          {building.eventCount} Events
                                        </Badge>
                                      )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <MapPin className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {filteredBuildings.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Keine Gebäude in diesem Campus</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Help section */}
      <Card className="mt-8 bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Info className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Tipps zur Routenplanung</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • Planen Sie genügend Zeit zwischen Veranstaltungen an
                  verschiedenen Standorten ein (mindestens 10-15 Minuten)
                </li>
                <li>
                  • Der Weg zwischen Schloss Campus und Westerberg/Caprivi
                  dauert zu Fuß ca. 15-20 Minuten
                </li>
                <li>
                  • Zwischen Caprivi und Haste Campus empfehlen wir den Bus zu
                  nutzen (Linie X)
                </li>
                <li>
                  • Achten Sie auf orangene/rote Warnungen - diese zeigen
                  kritische Zeitfenster an
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
