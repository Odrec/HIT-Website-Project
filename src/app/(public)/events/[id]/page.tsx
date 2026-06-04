'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  GraduationCap,
  Building2,
  Mail,
  Phone,
  Share2,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Info,
} from 'lucide-react'
import { formatEventDateLong, formatEventTime } from '@/lib/event-time'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { EventCard } from '@/components/events/EventCard'
import { AddToScheduleButton } from '@/components/schedule/AddToScheduleButton'
import { WatchlistButton } from '@/components/schedule/WatchlistButton'
import type { Event as ScheduleEvent } from '@/types/events'

interface Event {
  id: string
  title: string
  description: string | null
  eventType: string
  timeStart: string
  timeEnd: string | null
  locationDetails: string | null
  meetingPoint: string | null
  additionalInfo: string | null
  photoUrl: string | null
  institution: string
  building: {
    id: string
    slug: string
    name: string
    shortName: string | null
    address: string | null
    campus: string | null
    latitude: number | null
    longitude: number | null
    hasAccessibility: boolean
    accessibilityNotes: string | null
  } | null
  room: {
    id: string
    name: string
    floor: string | null
    buildingId: string
  } | null
  lecturers: Array<{
    id: string
    firstName: string
    lastName: string
    title: string | null
    email: string | null
    building: string | null
    roomNumber: string | null
  }>
  studyPrograms: Array<{
    id: string
    name: string
    institution: string
    links: Array<{ label: string; url: string }>
  }>
  organizers: Array<{
    id: string
    email: string
    phone: string | null
  }>
}

const eventTypeLabels: Record<string, string> = {
  VORTRAG: 'Vortrag',
  LABORFUEHRUNG: 'Laborführung',
  RUNDGANG: 'Rundgang',
  WORKSHOP: 'Workshop',
  ONLINE: 'Online',
  VIDEO: 'Video',
  INFOSTAND: 'Infostand',
  SCHNUPPER: 'Schnupperveranstaltung',
  INTERAKTION: 'Interaktion',
  SONSTIGES: 'Sonstiges',
}

const eventTypeColors: Record<string, string> = {
  VORTRAG: 'bg-blue-100 text-blue-800',
  LABORFUEHRUNG: 'bg-purple-100 text-purple-800',
  RUNDGANG: 'bg-green-100 text-green-800',
  WORKSHOP: 'bg-orange-100 text-orange-800',
  ONLINE: 'bg-gray-100 text-gray-800',
  VIDEO: 'bg-red-100 text-red-800',
  INFOSTAND: 'bg-pink-100 text-pink-800',
  SCHNUPPER: 'bg-teal-100 text-teal-800',
  INTERAKTION: 'bg-indigo-100 text-indigo-800',
  SONSTIGES: 'bg-slate-100 text-slate-700',
}

const institutionLabels: Record<string, string> = {
  UNI: 'Universität Osnabrück',
  HS: 'Hochschule Osnabrück',
  HOCHSCHULE: 'Hochschule Osnabrück',
  BOTH: 'Hochschulübergreifend',
}

const institutionColors: Record<string, string> = {
  UNI: 'bg-hit-uni-100 text-hit-uni-700',
  HS: 'bg-hit-hs-100 text-hit-hs-700',
  HOCHSCHULE: 'bg-hit-hs-100 text-hit-hs-700',
  BOTH: 'bg-gray-100 text-gray-600',
}

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/public/${eventId}`)
        if (!response.ok) {
          if (response.status === 404) {
            return notFound()
          }
          throw new Error('Failed to fetch event')
        }
        const data = await response.json()
        setEvent(data.event)
        setRelatedEvents(data.relatedEvents || [])
      } catch (error) {
        console.error('Error fetching event:', error)
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  // Convert API event to schedule-compatible event type
  const convertToScheduleEvent = (e: Event): ScheduleEvent => ({
    id: e.id,
    title: e.title,
    description: e.description ?? undefined,
    eventType: e.eventType as ScheduleEvent['eventType'],
    timeStart: e.timeStart ? new Date(e.timeStart) : undefined,
    timeEnd: e.timeEnd ? new Date(e.timeEnd) : undefined,
    institution: e.institution as ScheduleEvent['institution'],
    building: e.building ?? undefined,
    room: e.room ?? undefined,
    lecturers: e.lecturers.map((l) => ({
      id: l.id,
      eventId: e.id,
      firstName: l.firstName,
      lastName: l.lastName,
      title: l.title ?? undefined,
      email: l.email ?? undefined,
      building: l.building ?? undefined,
      roomNumber: l.roomNumber ?? undefined,
    })),
    studyPrograms: e.studyPrograms.map((sp) => ({
      id: sp.id,
      name: sp.name,
      institution: sp.institution as ScheduleEvent['institution'],
      links: sp.links,
    })),
    meetingPoint: e.meetingPoint ?? undefined,
    photoUrl: e.photoUrl ?? undefined,
    additionalInfo: e.additionalInfo ?? undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`HIT 2026: ${event?.title}`)
    const body = encodeURIComponent(
      `Schau dir diese Veranstaltung an:\n\n${event?.title}\n\n${window.location.href}`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-8 h-12 w-3/4" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-hit-gray-900">Veranstaltung nicht gefunden</h1>
        <p className="mt-2 text-hit-gray-600">
          Die angeforderte Veranstaltung existiert nicht oder wurde entfernt.
        </p>
        <Link href="/events">
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>
    )
  }

  const formatDate = (dateString: string) => formatEventDateLong(dateString)

  const formatTime = (dateString: string) => formatEventTime(dateString)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        href="/events"
        className="inline-flex items-center text-sm text-hit-gray-600 hover:text-hit-uni-500 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Zurück zur Übersicht
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className={cn('text-sm', eventTypeColors[event.eventType])}>
            {eventTypeLabels[event.eventType] || event.eventType}
          </Badge>
          <Badge className={cn('text-sm', institutionColors[event.institution])}>
            {institutionLabels[event.institution] || event.institution}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-hit-gray-900 lg:text-4xl">{event.title}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo */}
          {event.photoUrl && (
            <div className="relative h-64 overflow-hidden rounded-lg lg:h-80">
              <Image
                src={event.photoUrl}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 66vw, 100vw"
              />
            </div>
          )}

          {/* Description — only rendered when the event actually has one */}
          {event.description && (
            <Card>
              <CardHeader>
                <CardTitle>Beschreibung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-hit-gray-700">{event.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Lecturers / Speakers */}
          {event.lecturers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {event.eventType === 'VORTRAG' ? 'Referierende' : 'Ansprechpersonen'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {event.lecturers.map((lecturer) => (
                    <div key={lecturer.id} className="flex items-start gap-3 rounded-lg border p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hit-uni-100 text-hit-uni-700">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-hit-gray-900">
                          {lecturer.title && `${lecturer.title} `}
                          {lecturer.firstName} {lecturer.lastName}
                        </p>
                        {lecturer.email && (
                          <a
                            href={`mailto:${lecturer.email}`}
                            className="text-sm text-hit-uni-600 hover:underline flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3" />
                            {lecturer.email}
                          </a>
                        )}
                        {lecturer.building && (
                          <p className="text-sm text-hit-gray-600 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {lecturer.building}
                            {lecturer.roomNumber && `, Raum ${lecturer.roomNumber}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Study Programs */}
          {event.studyPrograms.length > 0 &&
            (() => {
              const linkedPrograms = event.studyPrograms.filter((p) => p.links.length > 0)
              const unlinkedPrograms = event.studyPrograms.filter((p) => p.links.length === 0)
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Studiengangsinformationen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {linkedPrograms.length > 0 && (
                      <ul className="divide-y divide-hit-gray-200">
                        {linkedPrograms.map((program) => (
                          <li key={program.id} className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{program.name}</span>
                              <span
                                className={cn(
                                  'text-xs',
                                  program.institution === 'UNI'
                                    ? 'text-hit-uni-500'
                                    : 'text-hit-hs-500'
                                )}
                              >
                                ({program.institution === 'UNI' ? 'Uni' : 'HS'})
                              </span>
                            </div>
                            <ul className="mt-1.5 space-y-1">
                              {program.links.map((link, i) => (
                                <li key={i}>
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-1.5 text-sm text-hit-uni-600 hover:text-hit-uni-700 hover:underline"
                                  >
                                    {link.label}
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}
                    {unlinkedPrograms.length > 0 && (
                      <div>
                        {linkedPrograms.length > 0 && (
                          <h3 className="mb-2 text-sm font-semibold text-hit-gray-700">
                            Weitere Studiengänge
                          </h3>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {unlinkedPrograms.map((program) => (
                            <Badge key={program.id} variant="outline" className="text-sm">
                              {program.name}
                              <span
                                className={cn(
                                  'ml-1 text-xs',
                                  program.institution === 'UNI'
                                    ? 'text-hit-uni-500'
                                    : 'text-hit-hs-500'
                                )}
                              >
                                ({program.institution === 'UNI' ? 'Uni' : 'HS'})
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })()}

          {/* Additional Info */}
          {event.additionalInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Zusätzliche Informationen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-hit-gray-700">{event.additionalInfo}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="space-y-2">
                <AddToScheduleButton
                  event={convertToScheduleEvent(event)}
                  className="w-full"
                />
                <WatchlistButton
                  event={convertToScheduleEvent(event)}
                  variant="outline"
                  className="w-full"
                />
              </div>

              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Share2 className="mr-2 h-4 w-4" />
                    Teilen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Veranstaltung teilen</DialogTitle>
                    <DialogDescription>
                      Teilen Sie diese Veranstaltung mit anderen Interessierten.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {copied ? 'Link kopiert!' : 'Link kopieren'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleShareEmail}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Per E-Mail teilen
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Time & Date */}
          <Card>
            <CardHeader>
              <CardTitle>Termin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-hit-uni-500" />
                <div>
                  <p className="font-medium text-hit-gray-900">{formatDate(event.timeStart)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-hit-uni-500" />
                <div>
                  <p className="font-medium text-hit-gray-900">
                    {formatTime(event.timeStart)} Uhr
                    {event.timeEnd && ` - ${formatTime(event.timeEnd)} Uhr`}
                  </p>
                  {event.timeEnd && (
                    <p className="text-sm text-hit-gray-600">
                      Dauer:{' '}
                      {Math.round(
                        (new Date(event.timeEnd).getTime() - new Date(event.timeStart).getTime()) /
                          (1000 * 60)
                      )}{' '}
                      Minuten
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Ort</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.building ? (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-hit-uni-500" />
                  <div>
                    <p className="font-medium text-hit-gray-900">{event.building.name}</p>
                    {event.room?.name && (
                      <p className="text-hit-gray-600">Raum {event.room.name}</p>
                    )}
                    {event.building.address && (
                      <p className="text-sm text-hit-gray-500 mt-1">{event.building.address}</p>
                    )}
                  </div>
                </div>
              ) : event.meetingPoint ? (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-hit-uni-500" />
                  <div>
                    <p className="text-sm text-hit-gray-500">Treffpunkt:</p>
                    <p className="font-medium text-hit-gray-900">{event.meetingPoint}</p>
                  </div>
                </div>
              ) : (
                <p className="text-hit-gray-500 italic">Ort wird noch bekannt gegeben</p>
              )}

              {/* Open location in Google Maps — pass the building name/address so
                  the pin is labelled instead of showing raw coordinates. */}
              {event.building?.latitude != null && event.building?.longitude != null && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [event.building.name, event.building.address, 'Osnabrück']
                        .filter(Boolean)
                        .join(', ')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Auf dem Lageplan anzeigen
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          {event.organizers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Kontakt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {event.organizers.map((organizer) => (
                    <div key={organizer.id} className="space-y-1">
                      {organizer.email && (
                        <a
                          href={`mailto:${organizer.email}`}
                          className="flex items-center gap-2 text-sm text-hit-uni-600 hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          {organizer.email}
                        </a>
                      )}
                      {organizer.phone && (
                        <a
                          href={`tel:${organizer.phone}`}
                          className="flex items-center gap-2 text-sm text-hit-gray-600 hover:text-hit-uni-600"
                        >
                          <Phone className="h-4 w-4" />
                          {organizer.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <div className="mt-12">
          <Separator className="mb-8" />
          <h2 className="text-2xl font-bold text-hit-gray-900 mb-6">Ähnliche Veranstaltungen</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedEvents.slice(0, 3).map((relEvent) => (
              <EventCard key={relEvent.id} event={relEvent} viewMode="grid" />
            ))}
          </div>
          {relatedEvents.length > 3 && (
            <div className="mt-6 text-center">
              <Link href={`/events/program/${event.studyPrograms[0]?.id || ''}`}>
                <Button variant="outline">Weitere ähnliche Veranstaltungen anzeigen</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
