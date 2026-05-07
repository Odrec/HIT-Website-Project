'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnimatedHeroBanner } from '@/components/home/animated-hero-banner'

const USE_ANIMATED_BANNER = process.env.NEXT_PUBLIC_ANIMATED_BANNER === 'true'

export default function HomePage() {
  const [eventCount, setEventCount] = useState(0)

  useEffect(() => {
    fetch('/api/events/public?pageSize=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setEventCount(data.total)
      })
      .catch((error) => console.error('Error fetching event count:', error))
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-hit-uni-600 via-hit-uni-500 to-hit-hs-500 text-white">
        {USE_ANIMATED_BANNER ? (
          <AnimatedHeroBanner />
        ) : (
          <Image
            src="/infotag-banner.png"
            alt=""
            fill
            priority
            className="object-cover object-top -z-0"
          />
        )}
        {/* Dark overlay for text legibility on top of the artwork */}
        <div className="absolute inset-0 bg-black/30 -z-0" />
        {/* Störer (Eyecatcher) */}
        <Image
          src="/infotag-stoerer.svg"
          alt="Heute schon an morgen gedacht?"
          width={275}
          height={278}
          priority
          className="absolute right-4 top-4 z-20 hidden w-32 -rotate-6 drop-shadow-xl md:block lg:right-8 lg:top-8 lg:w-44"
        />
        <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30">November 2026</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Hochschul&shy;infotag 2026
            </h1>
            <p className="mt-6 text-lg text-white/90 max-w-2xl">
              Entdecken Sie die Universität und Hochschule Osnabrück! Besuchen Sie Vorträge,
              Laborführungen und Workshops zu über 200 Studiengängen.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/events">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-hit-uni-700 hover:bg-white/90"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Alle Veranstaltungen
                </Button>
              </Link>
              <Link href="/navigator">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white bg-transparent hover:bg-white/10"
                >
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

            <Link href="/study-programs" className="group">
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

            <Link href="/route-planner" className="group">
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

      {/* Institutions */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-hit-gray-900 text-center lg:text-3xl mb-8">
            Zwei Hochschulen – ein Infotag
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
                  <Button
                    variant="outline"
                    className="w-full text-hit-uni-700 border-hit-uni-300 hover:bg-hit-uni-50"
                  >
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
                  <Button
                    variant="outline"
                    className="w-full text-hit-hs-700 border-hit-hs-300 hover:bg-hit-hs-50"
                  >
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
          <h2 className="text-2xl font-bold lg:text-3xl">Bereit für den Hochschulinfotag?</h2>
          <p className="mt-4 text-white/90 max-w-2xl mx-auto">
            Erstellen Sie jetzt Ihren persönlichen Stundenplan und verpassen Sie keine
            Veranstaltung.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/events">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-hit-uni-700 hover:bg-white/90"
              >
                Veranstaltungen entdecken
              </Button>
            </Link>
            <Link href="/schedule">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white bg-transparent hover:bg-white/10"
              >
                Stundenplan erstellen
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
