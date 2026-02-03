'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Calendar, 
  Search, 
  Clock, 
  MapPin, 
  GraduationCap,
  Compass,
  ArrowRight,
  Users,
  Building2,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface FeaturedEvent {
  id: string
  title: string
  description: string | null
  eventType: string
  timeStart: string
  institution: string
  location: {
    buildingName: string
  } | null
}

const eventTypeLabels: Record<string, string> = {
  VORTRAG: 'Vortrag',
  LABORFUEHRUNG: 'Laborführung',
  RUNDGANG: 'Rundgang',
  WORKSHOP: 'Workshop',
  LINK: 'Online-Link',
  INFOSTAND: 'Infostand',
}

const eventTypeColors: Record<string, string> = {
  VORTRAG: 'bg-blue-100 text-blue-800',
  LABORFUEHRUNG: 'bg-purple-100 text-purple-800',
  RUNDGANG: 'bg-green-100 text-green-800',
  WORKSHOP: 'bg-orange-100 text-orange-800',
  LINK: 'bg-gray-100 text-gray-800',
  INFOSTAND: 'bg-pink-100 text-pink-800',
}

export default function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [eventCount, setEventCount] = useState(0)

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        const response = await fetch('/api/events/public?pageSize=4&sortBy=timeStart&sortOrder=asc')
        if (response.ok) {
          const data = await response.json()
          setFeaturedEvents(data.events)
          setEventCount(data.total)
        }
      } catch (error) {
        console.error('Error fetching featured events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFeaturedEvents()
  }, [])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-hit-uni-600 via-hit-uni-500 to-hit-hs-500 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 py-16 lg:py-24 relative">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30">
              November 2026
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Hochschul&shy;informationstag 2026
            </h1>
            <p className="mt-6 text-lg text-white/90 max-w-2xl">
              Entdecken Sie die Universität und Hochschule Osnabrück! 
              Besuchen Sie Vorträge, Laborführungen und Workshops zu über 200 Studiengängen.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/events">
                <Button size="lg" variant="secondary" className="bg-white text-hit-uni-700 hover:bg-white/90">
                  <Calendar className="mr-2 h-5 w-5" />
                  Alle Veranstaltungen
                </Button>
              </Link>
              <Link href="/navigator">
                <Button size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white/10">
                  <Compass className="mr-2 h-5 w-5" />
                  Studiennavigator
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:mt-16">
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">{eventCount || '100+'}</div>
              <div className="text-sm text-white/80">Veranstaltungen</div>
            </div>
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">200+</div>
              <div className="text-sm text-white/80">Studiengänge</div>
            </div>
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">2</div>
              <div className="text-sm text-white/80">Hochschulen</div>
            </div>
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">1</div>
              <div className="text-sm text-white/80">Tag</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="border-b bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/events" className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-hit-uni-100 text-hit-uni-600 group-hover:bg-hit-uni-200 transition-colors">
                    <Search className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-hit-gray-900">Veranstaltungen suchen</h3>
                    <p className="text-sm text-hit-gray-600">Alle Events durchsuchen</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/schedule" className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-hit-hs-100 text-hit-hs-600 group-hover:bg-hit-hs-200 transition-colors">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-hit-gray-900">Stundenplan erstellen</h3>
                    <p className="text-sm text-hit-gray-600">Ihren Tag planen</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/programs" className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-hit-gray-900">Studiengänge</h3>
                    <p className="text-sm text-hit-gray-600">Alle Programme entdecken</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/map" className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-hit-gray-900">Campusplan</h3>
                    <p className="text-sm text-hit-gray-600">Orientierung finden</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="bg-hit-gray-50 py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-hit-gray-900 lg:text-3xl">
                Kommende Veranstaltungen
              </h2>
              <p className="mt-2 text-hit-gray-600">
                Entdecken Sie unsere nächsten Events
              </p>
            </div>
            <Link href="/events" className="hidden sm:block">
              <Button variant="outline">
                Alle anzeigen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-lg">
                    <CardHeader className="pb-2">
                      <div className="flex gap-2">
                        <Badge className={cn('text-xs', eventTypeColors[event.eventType])}>
                          {eventTypeLabels[event.eventType]}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2 text-lg mt-2">
                        {event.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {event.description && (
                        <CardDescription className="line-clamp-2 mb-3">
                          {event.description}
                        </CardDescription>
                      )}
                      <div className="space-y-1 text-sm text-hit-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(event.timeStart)} Uhr</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">{event.location.buildingName}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="py-12 text-center">
              <CardContent>
                <Calendar className="mx-auto h-12 w-12 text-hit-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-hit-gray-900">
                  Noch keine Veranstaltungen
                </h3>
                <p className="mt-2 text-hit-gray-600">
                  Die Veranstaltungen werden bald veröffentlicht.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link href="/events">
              <Button variant="outline">
                Alle Veranstaltungen anzeigen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Institutions */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-hit-gray-900 text-center lg:text-3xl mb-8">
            Zwei Hochschulen – ein Informationstag
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Universität */}
            <Card className="overflow-hidden border-t-4 border-t-hit-uni-500">
              <CardHeader className="bg-hit-uni-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-hit-uni-500 text-white">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-hit-uni-700">Universität Osnabrück</CardTitle>
                    <CardDescription>Forschung und Lehre seit 1974</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2 text-sm text-hit-gray-600">
                  <li className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-hit-uni-500" />
                    <span>100+ Studiengänge</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-hit-uni-500" />
                    <span>14.000+ Studierende</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-hit-uni-500" />
                    <span>Exzellente Forschung</span>
                  </li>
                </ul>
                <Link href="/events?institution=UNI" className="block mt-4">
                  <Button variant="outline" className="w-full text-hit-uni-700 border-hit-uni-300 hover:bg-hit-uni-50">
                    Uni-Veranstaltungen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Hochschule */}
            <Card className="overflow-hidden border-t-4 border-t-hit-hs-500">
              <CardHeader className="bg-hit-hs-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-hit-hs-500 text-white">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-hit-hs-700">Hochschule Osnabrück</CardTitle>
                    <CardDescription>Praxisnah studieren seit 1971</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2 text-sm text-hit-gray-600">
                  <li className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-hit-hs-500" />
                    <span>100+ Studiengänge</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-hit-hs-500" />
                    <span>13.000+ Studierende</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-hit-hs-500" />
                    <span>Praxisnahe Ausbildung</span>
                  </li>
                </ul>
                <Link href="/events?institution=HS" className="block mt-4">
                  <Button variant="outline" className="w-full text-hit-hs-700 border-hit-hs-300 hover:bg-hit-hs-50">
                    HS-Veranstaltungen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-hit-uni-600 to-hit-hs-500 py-12 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold lg:text-3xl">
            Bereit für den Hochschulinformationstag?
          </h2>
          <p className="mt-4 text-white/90 max-w-2xl mx-auto">
            Erstellen Sie jetzt Ihren persönlichen Stundenplan und verpassen Sie keine Veranstaltung.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/events">
              <Button size="lg" variant="secondary" className="bg-white text-hit-uni-700 hover:bg-white/90">
                Veranstaltungen entdecken
              </Button>
            </Link>
            <Link href="/schedule">
              <Button size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white/10">
                Stundenplan erstellen
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
