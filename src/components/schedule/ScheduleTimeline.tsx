'use client'

import { useMemo } from 'react'
import { format, parseISO, isSameDay } from 'date-fns'
import { de } from 'date-fns/locale'
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
} from 'lucide-react'

interface ScheduleTimelineProps {
  selectedDate?: Date
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

// Time slots for the day view (8:00 - 18:00)
const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8
  const minute = (i % 2) * 30
  return { hour, minute, label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` }
})

interface TimeSlotEvent {
  scheduleEvent: ScheduleEvent
  startSlot: number
  endSlot: number
  duration: number
  hasConflict: boolean
}

export function ScheduleTimeline({
  selectedDate,
  showControls = true,
  compact = false,
  className,
}: ScheduleTimelineProps) {
  const { state, removeEvent, updatePriority, getConflicts } = useSchedule()

  // Get events for the selected date
  const eventsForDate = useMemo(() => {
    if (!selectedDate) {
      return state.items
    }
    return state.items.filter((item) => {
      if (!item.event.timeStart) return false
      const eventDate = new Date(item.event.timeStart)
      return isSameDay(eventDate, selectedDate)
    })
  }, [state.items, selectedDate])

  // Map events to time slots
  const timeSlotEvents = useMemo(() => {
    const conflicts = getConflicts()
    const conflictEventIds = new Set<string>()
    conflicts.forEach((c) => {
      conflictEventIds.add(c.event1.eventId)
      conflictEventIds.add(c.event2.eventId)
    })

    return eventsForDate
      .map((scheduleEvent) => {
        if (!scheduleEvent.event.timeStart) return null

        const startTime = new Date(scheduleEvent.event.timeStart)
        const endTime = scheduleEvent.event.timeEnd
          ? new Date(scheduleEvent.event.timeEnd)
          : new Date(startTime.getTime() + 60 * 60 * 1000) // Default 1 hour

        const startMinutes = startTime.getHours() * 60 + startTime.getMinutes()
        const endMinutes = endTime.getHours() * 60 + endTime.getMinutes()

        // Calculate slot positions (30-min slots starting at 8:00)
        const startSlot = Math.max(0, Math.floor((startMinutes - 480) / 30))
        const endSlot = Math.min(20, Math.ceil((endMinutes - 480) / 30))
        const duration = endSlot - startSlot

        return {
          scheduleEvent,
          startSlot,
          endSlot,
          duration: Math.max(1, duration),
          hasConflict: conflictEventIds.has(scheduleEvent.eventId),
        } as TimeSlotEvent
      })
      .filter((e): e is TimeSlotEvent => e !== null)
      .sort((a, b) => a.startSlot - b.startSlot)
  }, [eventsForDate, getConflicts])

  // Group overlapping events for layout
  const layoutEvents = useMemo(() => {
    const columns: TimeSlotEvent[][] = []

    timeSlotEvents.forEach((event) => {
      // Find a column where this event doesn't overlap
      let placed = false
      for (const column of columns) {
        const lastInColumn = column[column.length - 1]
        if (lastInColumn.endSlot <= event.startSlot) {
          column.push(event)
          placed = true
          break
        }
      }
      if (!placed) {
        columns.push([event])
      }
    })

    return columns
  }, [timeSlotEvents])

  const handleRemoveEvent = (eventId: string) => {
    removeEvent(eventId)
  }

  const handlePriorityUp = (eventId: string, currentPriority: number) => {
    updatePriority(eventId, Math.max(1, currentPriority - 1))
  }

  const handlePriorityDown = (eventId: string, currentPriority: number) => {
    updatePriority(eventId, currentPriority + 1)
  }

  if (eventsForDate.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {selectedDate
            ? `Keine Events für ${format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}`
            : 'Noch keine Events in deinem Zeitplan'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Füge Events hinzu, um deinen persönlichen Zeitplan zu erstellen
        </p>
      </div>
    )
  }

  const numColumns = layoutEvents.length

  return (
    <div className={cn('relative', className)}>
      {/* Date header */}
      {selectedDate && (
        <h3 className="text-lg font-semibold mb-4">
          {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}
        </h3>
      )}

      {/* Timeline container */}
      <div className="flex">
        {/* Time labels */}
        <div className="flex-shrink-0 w-16 pr-2">
          {TIME_SLOTS.map((slot, idx) => (
            <div
              key={slot.label}
              className={cn(
                'h-12 text-xs text-muted-foreground flex items-start justify-end pr-2',
                idx % 2 === 0 ? 'font-medium' : 'text-muted-foreground/50'
              )}
            >
              {idx % 2 === 0 && slot.label}
            </div>
          ))}
        </div>

        {/* Timeline grid */}
        <div className="flex-grow relative">
          {/* Grid lines */}
          <div className="absolute inset-0">
            {TIME_SLOTS.map((slot, idx) => (
              <div
                key={slot.label}
                className={cn(
                  'h-12 border-t',
                  idx % 2 === 0 ? 'border-border' : 'border-border/50'
                )}
              />
            ))}
          </div>

          {/* Events */}
          <div className="relative" style={{ minHeight: `${TIME_SLOTS.length * 48}px` }}>
            {layoutEvents.map((column, colIdx) =>
              column.map((item) => {
                const columnWidth = 100 / numColumns
                const left = colIdx * columnWidth
                const top = item.startSlot * 48
                const height = item.duration * 48

                return (
                  <Card
                    key={item.scheduleEvent.id}
                    className={cn(
                      'absolute overflow-hidden transition-all',
                      item.hasConflict && 'ring-2 ring-yellow-500',
                      compact ? 'p-1' : 'p-2'
                    )}
                    style={{
                      top: `${top}px`,
                      height: `${height - 4}px`,
                      left: `${left}%`,
                      width: `calc(${columnWidth}% - 4px)`,
                    }}
                  >
                    <CardContent className="p-0 h-full flex flex-col">
                      {/* Event header */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-grow min-w-0">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs mb-1',
                              eventTypeColors[item.scheduleEvent.event.eventType]
                            )}
                          >
                            {eventTypeLabels[item.scheduleEvent.event.eventType]}
                          </Badge>
                          <h4 className={cn(
                            'font-medium line-clamp-2',
                            compact ? 'text-xs' : 'text-sm'
                          )}>
                            {item.scheduleEvent.event.title}
                          </h4>
                        </div>

                        {/* Conflict warning */}
                        {item.hasConflict && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>

                      {/* Event details */}
                      {!compact && height >= 96 && (
                        <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                          {item.scheduleEvent.event.timeStart && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(new Date(item.scheduleEvent.event.timeStart), 'HH:mm')}
                                {item.scheduleEvent.event.timeEnd && (
                                  <> - {format(new Date(item.scheduleEvent.event.timeEnd), 'HH:mm')}</>
                                )}
                              </span>
                            </div>
                          )}
                          {item.scheduleEvent.event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {item.scheduleEvent.event.location.buildingName}
                                {item.scheduleEvent.event.location.roomNumber &&
                                  `, ${item.scheduleEvent.event.location.roomNumber}`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Controls */}
                      {showControls && !compact && height >= 144 && (
                        <div className="mt-auto pt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                handlePriorityUp(
                                  item.scheduleEvent.eventId,
                                  item.scheduleEvent.priority
                                )
                              }
                              title="Priorität erhöhen"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <span className="text-xs font-medium px-1">
                              P{item.scheduleEvent.priority}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                handlePriorityDown(
                                  item.scheduleEvent.eventId,
                                  item.scheduleEvent.priority
                                )
                              }
                              title="Priorität verringern"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() =>
                              handleRemoveEvent(item.scheduleEvent.eventId)
                            }
                            title="Entfernen"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Conflicts summary */}
      {getConflicts().length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">
              {getConflicts().length} Zeitkonflikt{getConflicts().length > 1 ? 'e' : ''} erkannt
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-yellow-700">
            {getConflicts().map((conflict, idx) => (
              <li key={idx}>
                <span className="font-medium">{conflict.event1.event.title}</span>
                {' und '}
                <span className="font-medium">{conflict.event2.event.title}</span>
                {' überschneiden sich um '}
                {conflict.overlapMinutes} Minuten
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
