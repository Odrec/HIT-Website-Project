'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { eventTypeLabels, institutionLabels } from '@/lib/validations/event'

interface Event {
  id: string
  title: string
  description: string | null
  eventType: string
  timeStart: string | null
  timeEnd: string | null
  institution: string
  locationType: string
  location: { buildingName: string; roomNumber: string | null } | null
  studyPrograms: { studyProgram: { name: string } }[]
  createdAt: string
}

interface EventsResponse {
  data: Event[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function EventsListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [eventType, setEventType] = useState(searchParams.get('eventType') || '')
  const [institution, setInstitution] = useState(searchParams.get('institution') || '')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('pageSize', '20')
      if (search) params.set('search', search)
      if (eventType) params.set('eventType', eventType)
      if (institution) params.set('institution', institution)

      const res = await fetch(`/api/events?${params.toString()}`)
      const data: EventsResponse = await res.json()

      setEvents(data.data)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, eventType, institution])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchEvents()
  }

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}/duplicate`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchEvents()
      }
    } catch (error) {
      console.error('Error duplicating event:', error)
    }
  }

  const handleDelete = async () => {
    if (!eventToDelete) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${eventToDelete.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteDialogOpen(false)
        setEventToDelete(null)
        fetchEvents()
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setEventType('')
    setInstitution('')
    setPage(1)
  }

  const getEventTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      VORTRAG: 'bg-blue-100 text-blue-800',
      LABORFUEHRUNG: 'bg-purple-100 text-purple-800',
      RUNDGANG: 'bg-green-100 text-green-800',
      WORKSHOP: 'bg-orange-100 text-orange-800',
      LINK: 'bg-gray-100 text-gray-800',
      INFOSTAND: 'bg-yellow-100 text-yellow-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getInstitutionBadgeColor = (inst: string) => {
    const colors: Record<string, string> = {
      UNI: 'bg-[#003366] text-white',
      HOCHSCHULE: 'bg-[#FF6B00] text-white',
      BOTH: 'bg-gradient-to-r from-[#003366] to-[#FF6B00] text-white',
    }
    return colors[inst] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Veranstaltungen</h1>
          <p className="text-gray-500">{loading ? '...' : `${total} Veranstaltungen`}</p>
        </div>
        <Link href="/admin/events/new">
          <Button variant="uni">
            <Plus className="mr-2 h-4 w-4" />
            Neue Veranstaltung
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Suche nach Titel, Beschreibung, Dozent..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={eventType || 'all'}
                onValueChange={(v) => setEventType(v === 'all' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Veranstaltungstyp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={institution || 'all'}
                onValueChange={(v) => setInstitution(v === 'all' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Institution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {Object.entries(institutionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="outline" size="sm">
                <Search className="mr-2 h-4 w-4" />
                Suchen
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Filter zurücksetzen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Keine Veranstaltungen gefunden
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {search || eventType || institution
                  ? 'Versuchen Sie, die Filter anzupassen.'
                  : 'Erstellen Sie Ihre erste Veranstaltung.'}
              </p>
              {!search && !eventType && !institution && (
                <Link href="/admin/events/new" className="mt-4 inline-block">
                  <Button variant="uni">
                    <Plus className="mr-2 h-4 w-4" />
                    Erste Veranstaltung erstellen
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-4 p-4 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="text-base font-medium text-gray-900 hover:text-blue-600 truncate"
                      >
                        {event.title}
                      </Link>
                      <Badge
                        className={getEventTypeBadgeColor(event.eventType)}
                        variant="secondary"
                      >
                        {eventTypeLabels[event.eventType] || event.eventType}
                      </Badge>
                      <Badge
                        className={getInstitutionBadgeColor(event.institution)}
                        variant="secondary"
                      >
                        {institutionLabels[event.institution] || event.institution}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-500 line-clamp-1 mb-2">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {event.timeStart && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(event.timeStart), 'PPp', { locale: de })}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location.buildingName}
                          {event.location.roomNumber && `, ${event.location.roomNumber}`}
                        </span>
                      )}
                      {event.studyPrograms.length > 0 && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {event.studyPrograms.length} Studiengänge
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/events/${event.id}`)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(event.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplizieren
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setEventToDelete(event)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Seite {page} von {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Zurück
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Weiter
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Veranstaltung löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie die Veranstaltung <strong>{eventToDelete?.title}</strong>{' '}
              löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Löschen...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
