'use client'

import Link from 'next/link'
import { Clock, MapPin, User, GraduationCap, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
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
    }>
    meetingPoint?: string | null
    photoUrl?: string | null
  }
  viewMode: 'list' | 'grid'
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
    location: event.location ? {
      id: event.location.id,
      buildingName: event.location.buildingName,
      roomNumber: event.location.roomNumber ?? undefined,
      address: event.location.address ?? undefined,
    } : undefined,
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
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: de })
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd. MMM yyyy', { locale: de })
  }

  const getLocationDisplay = () => {
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
    return event.lecturers.map((l) => 
      `${l.title ? l.title + ' ' : ''}${l.firstName} ${l.lastName}`
    ).join(', ')
  }

  if (viewMode === 'grid') {
    return (
      <Link href={`/events/${event.id}`}>
        <Card className="h-full transition-shadow hover:shadow-lg">
          {/* Optional photo */}
          {event.photoUrl && (
            <div className="relative h-40 overflow-hidden rounded-t-lg">
              <img 
                src={event.photoUrl} 
                alt={event.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          
          <CardHeader className="pb-2">
            <div className="flex flex-wrap gap-2">
              <Badge className={cn('text-xs', eventTypeColors[event.eventType])}>
                {eventTypeLabels[event.eventType] || event.eventType}
              </Badge>
              <Badge className={cn('text-xs', institutionColors[event.institution])}>
                {institutionLabels[event.institution] || event.institution}
              </Badge>
            </div>
            <h3 className="mt-2 line-clamp-2 font-semibold text-hit-gray-900 leading-tight">
              {event.title}
            </h3>
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
            
            {/* Date */}
            <div className="mt-1 flex items-center gap-2 text-sm text-hit-gray-600">
              <CalendarIcon className="h-4 w-4 flex-shrink-0" />
              <span>{formatDate(event.timeStart)}</span>
            </div>

            {/* Location */}
            {getLocationDisplay() && (
              <div className="mt-1 flex items-center gap-2 text-sm text-hit-gray-600">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">{getLocationDisplay()}</span>
              </div>
            )}

            {/* Study Programs (max 2) */}
            {event.studyPrograms.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {event.studyPrograms.slice(0, 2).map((sp) => (
                  <Badge key={sp.id} variant="outline" className="text-xs">
                    {sp.name.length > 20 ? sp.name.slice(0, 20) + '...' : sp.name}
                  </Badge>
                ))}
                {event.studyPrograms.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{event.studyPrograms.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    )
  }

  // List view
  return (
    <Link href={`/events/${event.id}`}>
      <Card className="transition-shadow hover:shadow-lg">
        <div className="flex flex-col sm:flex-row">
          {/* Time Column (on larger screens) */}
          <div className="hidden sm:flex sm:w-32 sm:flex-shrink-0 sm:flex-col sm:items-center sm:justify-center sm:border-r sm:bg-hit-gray-50 sm:p-4">
            <div className="text-2xl font-bold text-hit-uni-600">
              {formatTime(event.timeStart)}
            </div>
            {event.timeEnd && (
              <>
                <div className="text-hit-gray-400">bis</div>
                <div className="text-lg text-hit-gray-600">
                  {formatTime(event.timeEnd)}
                </div>
              </>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 sm:p-6">
            <div className="flex flex-wrap items-start gap-2">
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

            <h3 className="mt-2 text-lg font-semibold text-hit-gray-900">
              {event.title}
            </h3>

            {event.description && (
              <p className="mt-2 line-clamp-2 text-sm text-hit-gray-600">
                {event.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-hit-gray-600">
              {/* Date */}
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>{formatDate(event.timeStart)}</span>
              </div>

              {/* Location */}
              {getLocationDisplay() && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{getLocationDisplay()}</span>
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

            {/* Study Programs */}
            {event.studyPrograms.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-hit-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {event.studyPrograms.slice(0, 3).map((sp) => (
                    <Badge key={sp.id} variant="outline" className="text-xs">
                      {sp.name.length > 25 ? sp.name.slice(0, 25) + '...' : sp.name}
                    </Badge>
                  ))}
                  {event.studyPrograms.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{event.studyPrograms.length - 3} weitere
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Column */}
          <div
            className="flex items-center justify-end border-t p-4 sm:w-40 sm:flex-shrink-0 sm:flex-col sm:justify-center sm:border-l sm:border-t-0"
            onClick={(e) => e.preventDefault()}
          >
            <AddToScheduleButton
              event={convertToEvent(event)}
              variant="outline"
              size="sm"
              className="w-full sm:mb-2"
            />
            <span className="hidden text-xs text-hit-gray-500 sm:block">
              Details ansehen →
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
