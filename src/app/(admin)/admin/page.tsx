'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, GraduationCap, MapPin, Plus, TrendingUp } from 'lucide-react'

interface DashboardStats {
  totalEvents: number
  upcomingEvents: number
  totalStudyPrograms: number
  totalLocations: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    totalStudyPrograms: 0,
    totalLocations: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function fetchStats() {
      try {
        const [eventsRes, upcomingRes, programsRes, buildingsRes] = await Promise.all([
          fetch('/api/events?pageSize=1', { signal }),
          fetch('/api/events?pageSize=1&startDate=' + new Date().toISOString(), { signal }),
          fetch('/api/study-programs', { signal }),
          fetch('/api/buildings', { signal }),
        ])

        const eventsData = await eventsRes.json()
        const upcomingData = await upcomingRes.json()
        const programsData = await programsRes.json()
        const buildingsData = await buildingsRes.json()

        if (signal.aborted) return
        setStats({
          totalEvents: eventsData.total || 0,
          upcomingEvents: upcomingData.total || 0,
          totalStudyPrograms: Array.isArray(programsData) ? programsData.length : 0,
          totalLocations: Array.isArray(buildingsData) ? buildingsData.length : 0,
        })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.error('Error fetching stats:', error)
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    }

    fetchStats()
    return () => controller.abort()
  }, [])

  const statCards = [
    {
      title: 'Veranstaltungen',
      value: stats.totalEvents,
      description: 'Gesamtzahl der Events',
      icon: Calendar,
      href: '/admin/events',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Kommende Events',
      value: stats.upcomingEvents,
      description: 'Events in der Zukunft',
      icon: TrendingUp,
      href: '/admin/events?filter=upcoming',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Studiengänge',
      value: stats.totalStudyPrograms,
      description: 'Verfügbare Programme',
      icon: GraduationCap,
      href: '/admin/study-programs',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Gebäude',
      value: stats.totalLocations,
      description: 'Registrierte Gebäude',
      icon: MapPin,
      href: '/admin/buildings',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Willkommen im HIT Admin-Bereich</p>
        </div>
        <Link href="/admin/events/new">
          <Button variant="uni">
            <Plus className="mr-2 h-4 w-4" />
            Neue Veranstaltung
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stat.value}</div>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
            <CardDescription>Häufig verwendete Funktionen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/events/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Neue Veranstaltung erstellen
              </Button>
            </Link>
            <Link href="/admin/import-export" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Events importieren/exportieren
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Letzte Aktivitäten</CardTitle>
            <CardDescription>Neueste Änderungen im System</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Keine aktuellen Aktivitäten</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
