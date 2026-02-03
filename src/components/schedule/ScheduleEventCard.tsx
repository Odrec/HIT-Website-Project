'use client'

import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import Link from 'next/link'
import { useSchedule, type ScheduleEvent } from '@/contexts/schedule-context'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Clock,
  MapPin,
  AlertTriangle,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'

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
  LINK: 'Link',
  INFOSTAND: 'Infostand',
}

// Event type badge colors
const eventTypeColors: Record<string, string> = {
  VORTRAG: 'bg-blue-100 text-blue-800 border-blue-200',
  LABORFUEHRUNG: 'bg-purple-100 text-purple-800 border-purple-200',
  RUNDGANG: 'bg-green-100 text-green-800 border-green-200',
  WORKSHOP: 'bg-orange-100 text-orange-800 border-orange-200',
  LINK: 'bg-gray-100 text-gray-800 border-gray-200',
  INFOSTAND: 'bg-pink-100 text-pink-800 border-pink-200',
}

// Institution badge colors
const institutionLabels: Record<string, string> = {
  UNI: 'Universität',
  HOCHSCHULE: 'Hochschule',
  BOTH: 'Beide',
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

  const handlePriorityUp = () => {
    updatePriority(event.id, Math.max(1, priority - 1))
  }

  const handlePriorityDown = () => {
    updatePriority(event.id, priority + 1)
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
            <Badge
              variant="outline"
              className={cn('text-xs', eventTypeColors[event.eventType])}
            >
              {eventTypeLabels[event.eventType]}
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-xs', institutionColors[event.institution])}
            >
              {institutionLabels[event.institution]}
            </Badge>
          </div>
          
          {/* Priority indicator */}
          <div className="flex items-center gap-1">
            {hasConflict && (
              <span title="Zeitkonflikt">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </span>
            )}
            <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded">
              P{priority}
            </span>
          </div>
        </div>

        {/* Title */}
        <Link
          href={`/events/${event.id}`}
          className="group inline-flex items-center gap-1 hover:underline"
        >
          <h4 className={cn('font-semibold', compact ? 'text-sm' : 'text-base')}>
            {event.title}
          </h4>
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Time and location */}
        {!compact && (
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            {event.timeStart && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(event.timeStart), 'EEEE, d. MMMM', { locale: de })}
                  {' • '}
                  {format(new Date(event.timeStart), 'HH:mm')}
                  {event.timeEnd && (
                    <> - {format(new Date(event.timeEnd), 'HH:mm')}</>
                  )}
                </span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {event.location.buildingName}
                  {event.location.roomNumber && `, ${event.location.roomNumber}`}
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
            <span className="font-medium">Referent: </span>
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
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">Priorität:</span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handlePriorityUp}
                disabled={priority <= 1}
                title="Priorität erhöhen"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">{priority}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handlePriorityDown}
                title="Priorität verringern"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
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
        )}
      </CardContent>
    </Card>
  )
}
