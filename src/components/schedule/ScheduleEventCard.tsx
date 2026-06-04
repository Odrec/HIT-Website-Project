'use client'

import Link from 'next/link'
import { formatEventTimeRange, formatEventDateWeekday } from '@/lib/event-time'
import { useSchedule, type ScheduleEvent } from '@/contexts/schedule-context'
import {
  SCHEDULE_PRIORITY_LABELS,
  SCHEDULE_PRIORITY_ORDER,
  DEFAULT_SCHEDULE_PRIORITY,
  type SchedulePriority,
} from '@/types/schedule'
import { generateGoogleCalendarUrl } from '@/lib/calendar-utils'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, MapPin, AlertTriangle, Trash2, ExternalLink } from 'lucide-react'

const PRIORITY_BADGE_CLASS: Record<SchedulePriority, string> = {
  HIGH: 'bg-red-100 text-red-800 border-red-200',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
}

interface ScheduleEventCardProps {
  scheduleEvent: ScheduleEvent
  hasConflict?: boolean
  showControls?: boolean
  compact?: boolean
  className?: string
}

// Event type display labels
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

// Event type badge colors
const eventTypeColors: Record<string, string> = {
  VORTRAG: 'bg-blue-100 text-blue-800 border-blue-200',
  LABORFUEHRUNG: 'bg-purple-100 text-purple-800 border-purple-200',
  RUNDGANG: 'bg-green-100 text-green-800 border-green-200',
  WORKSHOP: 'bg-orange-100 text-orange-800 border-orange-200',
  ONLINE: 'bg-gray-100 text-gray-800 border-gray-200',
  VIDEO: 'bg-red-100 text-red-800 border-red-200',
  INFOSTAND: 'bg-pink-100 text-pink-800 border-pink-200',
  SCHNUPPER: 'bg-teal-100 text-teal-800 border-teal-200',
  INTERAKTION: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  SONSTIGES: 'bg-slate-100 text-slate-700 border-slate-200',
}

// Institution badge colors
const institutionLabels: Record<string, string> = {
  UNI: 'Universität',
  HOCHSCHULE: 'Hochschule',
  BOTH: 'Hochschulübergreifend',
}

const institutionColors: Record<string, string> = {
  UNI: 'bg-hit-uni-light text-hit-uni border-hit-uni/20',
  HOCHSCHULE: 'bg-hit-hs-light text-hit-hs border-hit-hs/20',
  BOTH: 'bg-gradient-to-r from-hit-uni-light to-hit-hs-light text-gray-800 border-gray-300',
}

export function ScheduleEventCard({
  scheduleEvent,
  hasConflict = false,
  showControls = true,
  compact = false,
  className,
}: ScheduleEventCardProps) {
  const { removeEvent, updatePriority } = useSchedule()
  const { event, priority } = scheduleEvent

  const handleRemove = () => {
    removeEvent(event.id)
  }

  const handlePrioritySelect = (next: SchedulePriority) => {
    updatePriority(event.id, next)
  }

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        hasConflict && 'ring-2 ring-yellow-500',
        className
      )}
    >
      <CardContent className={cn('p-4', compact && 'p-3')}>
        {/* Header with badges */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className={cn('text-xs', eventTypeColors[event.eventType])}>
              {eventTypeLabels[event.eventType]}
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-xs', institutionColors[event.institution])}
            >
              {institutionLabels[event.institution]}
            </Badge>
          </div>

          {/* Priority indicator — only shown when priority has been customized away from the default */}
          <div className="flex items-center gap-1">
            {hasConflict && (
              <span title="Zeitkonflikt">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </span>
            )}
            {priority !== DEFAULT_SCHEDULE_PRIORITY && (
              <Badge
                variant="outline"
                className={cn('text-xs', PRIORITY_BADGE_CLASS[priority])}
                title="Priorität: hilft dir, wichtige Termine zu markieren"
              >
                Prio. {SCHEDULE_PRIORITY_LABELS[priority]}
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <Link
          href={`/events/${event.id}`}
          className="group inline-flex items-center gap-1 hover:underline"
        >
          <h4 className={cn('font-semibold', compact ? 'text-sm' : 'text-base')}>{event.title}</h4>
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Time and location */}
        {!compact && (
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            {event.timeStart && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {formatEventDateWeekday(event.timeStart)}
                  {' • '}
                  {formatEventTimeRange(event.timeStart, event.timeEnd)}
                </span>
              </div>
            )}
            {event.building && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {event.building.name}
                  {event.room?.name && `, ${event.room.name}`}
                </span>
              </div>
            )}
            {event.meetingPoint && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-green-700">Treffpunkt: {event.meetingPoint}</span>
              </div>
            )}
          </div>
        )}

        {/* Lecturers */}
        {!compact && event.lecturers && event.lecturers.length > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium">Referierende: </span>
            {event.lecturers.map((l, i) => (
              <span key={l.id}>
                {i > 0 && ', '}
                {l.title && `${l.title} `}
                {l.firstName} {l.lastName}
              </span>
            ))}
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="mt-3 pt-3 border-t space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Priorität:</span>
                <div
                  role="radiogroup"
                  aria-label="Priorität wählen"
                  className="inline-flex rounded-md border border-input overflow-hidden"
                >
                  {SCHEDULE_PRIORITY_ORDER.map((p) => (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={priority === p}
                      onClick={() => handlePrioritySelect(p)}
                      className={cn(
                        'px-2.5 py-1 text-xs font-medium transition-colors',
                        priority === p
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {SCHEDULE_PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleRemove}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Entfernen
              </Button>
            </div>
            {event.timeStart && event.timeEnd && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs w-full justify-start"
                asChild
              >
                <a
                  href={generateGoogleCalendarUrl({
                    title: event.title,
                    description: event.description ?? null,
                    timeStart: new Date(event.timeStart),
                    timeEnd: new Date(event.timeEnd),
                    building: event.building ?? null,
                    room: event.room ?? null,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Zu Google Kalender hinzufügen"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  Zu Google Kalender hinzufügen
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
