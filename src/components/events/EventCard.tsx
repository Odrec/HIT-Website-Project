'use client'

import { trackEvent } from '@/lib/analytics'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, MapPin, User, GraduationCap, Info } from 'lucide-react'
import { formatEventTime } from '@/lib/event-time'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AddToScheduleButton } from '@/components/schedule/AddToScheduleButton'
import type { Event } from '@/types/events'

interface EventCardProps {
  event: {
    id: string
    title: string
    description: string | null
    eventType: string
    timeStart: string
    timeEnd: string | null
    locationType: string
    institution: string
    location?: {
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
    meetingPoint?: string | null
    photoUrl?: string | null
    locationHint?: string | null
    building?: { id: string; slug?: string; name: string } | null
    room?: { id: string; name: string } | null
  }
  viewMode: 'list' | 'grid'
}

const eventTypeLabels: Record<string, string> = {
  VORTRAG: 'Vortrag',
  LABORFUEHRUNG: 'Laborführung',
  RUNDGANG: 'Rundgang',
  WORKSHOP: 'Workshop',
  ONLINE: 'Online',
  VIDEO: 'Video',
  INFOSTAND: 'Infostand',
}

const eventTypeColors: Record<string, string> = {
  VORTRAG: 'bg-blue-100 text-blue-800',
  LABORFUEHRUNG: 'bg-purple-100 text-purple-800',
  RUNDGANG: 'bg-green-100 text-green-800',
  WORKSHOP: 'bg-orange-100 text-orange-800',
  ONLINE: 'bg-gray-100 text-gray-800',
  VIDEO: 'bg-red-100 text-red-800',
  INFOSTAND: 'bg-pink-100 text-pink-800',
}

const institutionLabels: Record<string, string> = {
  UNI: 'Universität',
  HS: 'Hochschule',
  BOTH: 'Uni & HS',
}

const institutionColors: Record<string, string> = {
  UNI: 'bg-hit-uni-100 text-hit-uni-700',
  HS: 'bg-hit-hs-100 text-hit-hs-700',
  BOTH: 'bg-gradient-to-r from-hit-uni-100 to-hit-hs-100 text-hit-gray-700',
}

// Helper to convert EventCard event to Event type for schedule
function convertToEvent(event: EventCardProps['event']): Event {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? undefined,
    eventType: event.eventType as Event['eventType'],
    timeStart: event.timeStart ? new Date(event.timeStart) : undefined,
    timeEnd: event.timeEnd ? new Date(event.timeEnd) : undefined,
    locationType: event.locationType as Event['locationType'],
    institution: event.institution as Event['institution'],
    building: event.building
      ? {
          id: event.building.id,
          // Slug is required for travel-time warnings on the schedule timeline.
          // The public events API returns it; if a caller passes a stripped
          // event, we fall back to the id as a last resort.
          slug: event.building.slug ?? event.building.id,
          name: event.building.name,
          shortName: null,
          address: null,
          campus: null,
          latitude: null,
          longitude: null,
          hasAccessibility: false,
          accessibilityNotes: null,
        }
      : undefined,
    room: event.room
      ? { id: event.room.id, name: event.room.name, floor: null, buildingId: '' }
      : undefined,
    lecturers: event.lecturers.map((l) => ({
      id: l.id,
      eventId: event.id,
      firstName: l.firstName,
      lastName: l.lastName,
      title: l.title ?? undefined,
    })),
    studyPrograms: event.studyPrograms.map((sp) => ({
      id: sp.id,
      name: sp.name,
      institution: sp.institution as Event['institution'],
    })),
    meetingPoint: event.meetingPoint ?? undefined,
    photoUrl: event.photoUrl ?? undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Event card component for displaying events in list or grid view
 */
export function EventCard({ event, viewMode }: EventCardProps) {
  const formatTime = (dateString: string) => formatEventTime(dateString)

  const getLocationDisplay = () => {
    if (event.building) {
      return `${event.building.name}${event.room?.name ? `, Raum ${event.room.name}` : ''}`
    }
    if (event.location) {
      return `${event.location.buildingName}${event.location.roomNumber ? `, Raum ${event.location.roomNumber}` : ''}`
    }
    if (event.meetingPoint) {
      return event.meetingPoint
    }
    return null
  }

  const getLecturerDisplay = () => {
    if (event.lecturers.length === 0) return null
    return event.lecturers
      .map((l) => `${l.title ? l.title + ' ' : ''}${l.firstName} ${l.lastName}`)
      .join(', ')
  }

  if (viewMode === 'grid') {
    return (
      <Link
        href={`/events/${event.id}`}
        onClick={() => trackEvent('event', 'detail-open', event.title)}
      >
        <Card className="h-full transition-shadow hover:shadow-lg">
          {/* Optional photo */}
          {event.photoUrl && (
            <div className="relative h-40 overflow-hidden rounded-t-lg">
              <Image
                src={event.photoUrl}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            </div>
          )}

          <CardHeader className="pb-2">
            {/* Study Programs - PRIMARY, displayed large */}
            {event.studyPrograms.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {event.studyPrograms.slice(0, 2).map((sp) => (
                  <span key={sp.id} className="text-sm font-semibold text-hit-uni-600">
                    {sp.name}
                  </span>
                ))}
                {event.studyPrograms.length > 2 && (
                  <span className="text-sm font-semibold text-hit-gray-400">
                    +{event.studyPrograms.length - 2} weitere
                  </span>
                )}
              </div>
            )}

            {/* Title - secondary, smaller */}
            <h3 className="mt-1 line-clamp-2 text-sm text-hit-gray-700 leading-tight">
              {event.title}
            </h3>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge className={cn('text-xs', eventTypeColors[event.eventType])}>
                {eventTypeLabels[event.eventType] || event.eventType}
              </Badge>
              <Badge className={cn('text-xs', institutionColors[event.institution])}>
                {institutionLabels[event.institution] || event.institution}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Time */}
            <div className="flex items-center gap-2 text-sm text-hit-gray-600">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>
                {formatTime(event.timeStart)}
                {event.timeEnd && ` - ${formatTime(event.timeEnd)}`}
              </span>
            </div>

            {/* Location */}
            <div className="mt-1 flex flex-col gap-0.5 text-sm text-hit-gray-600">
              {event.building ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {event.building.name}
                  {event.room && `, ${event.room.name}`}
                </span>
              ) : getLocationDisplay() ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="line-clamp-1">{getLocationDisplay()}</span>
                </span>
              ) : null}
              {event.locationHint && (
                <span className="flex items-center gap-1 italic text-hit-gray-500">
                  <Info className="h-3 w-3 flex-shrink-0" />
                  {event.locationHint}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  // List view
  return (
    <Link
      href={`/events/${event.id}`}
      onClick={() => trackEvent('event', 'detail-open', event.title)}
    >
      <Card className="transition-shadow hover:shadow-lg">
        <div className="flex flex-col sm:flex-row">
          {/* Time Column (on larger screens) */}
          <div className="hidden sm:flex sm:w-32 sm:flex-shrink-0 sm:flex-col sm:items-center sm:justify-center sm:border-r sm:bg-hit-gray-50 sm:p-4">
            <div className="text-2xl font-bold text-hit-uni-600">{formatTime(event.timeStart)}</div>
            {event.timeEnd && (
              <>
                <div className="text-hit-gray-400">bis</div>
                <div className="text-lg text-hit-gray-600">{formatTime(event.timeEnd)}</div>
              </>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 sm:p-6">
            {/* Study Programs - PRIMARY, displayed prominently */}
            {event.studyPrograms.length > 0 && (
              <div className="flex items-start gap-2">
                <GraduationCap className="mt-0.5 h-5 w-5 flex-shrink-0 text-hit-uni-500" />
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  {event.studyPrograms.map((sp, i) => (
                    <span key={sp.id} className="text-base font-semibold text-hit-uni-700">
                      {sp.name}
                      {i < event.studyPrograms.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Title - secondary, smaller */}
            <h3 className="mt-1 text-sm text-hit-gray-700">{event.title}</h3>

            <div className="mt-2 flex flex-wrap items-start gap-2">
              <Badge className={cn('text-xs', eventTypeColors[event.eventType])}>
                {eventTypeLabels[event.eventType] || event.eventType}
              </Badge>
              <Badge className={cn('text-xs', institutionColors[event.institution])}>
                {institutionLabels[event.institution] || event.institution}
              </Badge>
              {/* Mobile time badge */}
              <Badge variant="outline" className="sm:hidden">
                {formatTime(event.timeStart)}
                {event.timeEnd && ` - ${formatTime(event.timeEnd)}`}
              </Badge>
            </div>

            {event.description && (
              <p className="mt-2 line-clamp-2 text-sm text-hit-gray-500">{event.description}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-hit-gray-600">
              {/* Location */}
              {event.building ? (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {event.building.name}
                    {event.room && `, ${event.room.name}`}
                  </span>
                </div>
              ) : getLocationDisplay() ? (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{getLocationDisplay()}</span>
                </div>
              ) : null}
              {event.locationHint && (
                <div className="flex items-center gap-1 italic text-hit-gray-500">
                  <Info className="h-4 w-4" />
                  <span>{event.locationHint}</span>
                </div>
              )}

              {/* Lecturer */}
              {getLecturerDisplay() && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="line-clamp-1">{getLecturerDisplay()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Column */}
          <div className="flex items-center justify-end border-t p-4 sm:w-40 sm:flex-shrink-0 sm:flex-col sm:justify-center sm:border-l sm:border-t-0">
            <div className="w-full" onClick={(e) => e.preventDefault()}>
              <AddToScheduleButton
                event={convertToEvent(event)}
                variant="outline"
                size="sm"
                className="w-full sm:mb-2"
              />
            </div>
            <span className="hidden text-xs text-hit-gray-500 sm:block">Details ansehen →</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
