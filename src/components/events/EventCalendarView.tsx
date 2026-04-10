'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { formatEventTimeRange, formatEventDateKey, formatEventDateLong } from '@/lib/event-time'
import { Clock, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Event {
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
}

interface EventCalendarViewProps {
  events: Event[]
}

const eventTypeColors: Record<string, string> = {
  VORTRAG: 'bg-blue-500',
  LABORFUEHRUNG: 'bg-purple-500',
  RUNDGANG: 'bg-green-500',
  WORKSHOP: 'bg-orange-500',
  ONLINE: 'bg-gray-500',
  VIDEO: 'bg-red-500',
  INFOSTAND: 'bg-pink-500',
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

// Time slots for the HIT event (8:00 - 18:00)
const timeSlots = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
]

/**
 * Calendar view component for displaying events in a day timeline
 */
export function EventCalendarView({ events }: EventCalendarViewProps) {
  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {}

    events.forEach((event) => {
      const dateKey = formatEventDateKey(event.timeStart)
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })

    // Sort events within each day by start time
    Object.values(grouped).forEach((dayEvents) => {
      dayEvents.sort((a, b) => new Date(a.timeStart).getTime() - new Date(b.timeStart).getTime())
    })

    return grouped
  }, [events])

  const dates = Object.keys(eventsByDate).sort()

  // Get the position and height for an event based on its time.
  // Uses UTC components to read the Berlin wall-clock time.
  const getEventPosition = (event: Event) => {
    const startTime = new Date(event.timeStart)
    const endTime = event.timeEnd ? new Date(event.timeEnd) : null

    const startHour = startTime.getUTCHours()
    const startMinute = startTime.getUTCMinutes()

    // Calculate position from 8:00 (0%)
    const startSlot = (startHour - 8) * 2 + (startMinute >= 30 ? 1 : 0)
    const top = Math.max(0, startSlot) * (100 / timeSlots.length)

    // Calculate height based on duration
    let height = 100 / timeSlots.length // Default 30min
    if (endTime) {
      const endHour = endTime.getUTCHours()
      const endMinute = endTime.getUTCMinutes()
      const endSlot = (endHour - 8) * 2 + (endMinute >= 30 ? 1 : 0)
      const durationSlots = Math.max(1, endSlot - startSlot)
      height = durationSlots * (100 / timeSlots.length)
    }

    return { top: `${top}%`, height: `${Math.min(height, 100 - top)}%` }
  }

  if (dates.length === 0) {
    return (
      <div className="text-center py-8 text-hit-gray-600">
        Keine Veranstaltungen für die Kalenderansicht verfügbar.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {dates.map((date) => {
        const dayEvents = eventsByDate[date]
        // `date` is a yyyy-MM-dd key; use the first event's time for display
        // (it has the same Berlin wall-clock day).
        const displayDate = formatEventDateLong(dayEvents[0].timeStart)

        return (
          <div key={date}>
            {/* Date Header */}
            <h2 className="mb-4 text-lg font-semibold text-hit-gray-900">{displayDate}</h2>

            {/* Mobile: Chronological list view */}
            <div className="space-y-2 md:hidden">
              {dayEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`} className="block">
                  <Card
                    className={cn(
                      'border-l-4 p-3 transition-shadow hover:shadow-md',
                      eventTypeColors[event.eventType]?.replace('bg-', 'border-l-') ||
                        'border-l-gray-500'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm text-hit-gray-600">
                          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{formatEventTimeRange(event.timeStart, event.timeEnd)}</span>
                        </div>
                        <h3 className="mt-1 text-sm font-medium text-hit-gray-900 line-clamp-2">
                          {event.title}
                        </h3>
                        {event.location && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-hit-gray-500">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{event.location.buildingName}</span>
                          </div>
                        )}
                      </div>
                      <Badge
                        className={cn(
                          'flex-shrink-0 text-[10px] text-white',
                          eventTypeColors[event.eventType] || 'bg-gray-500'
                        )}
                      >
                        {eventTypeLabels[event.eventType]?.slice(0, 4) ||
                          event.eventType.slice(0, 4)}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Desktop: Day Timeline */}
            <Card className="hidden overflow-hidden md:block">
              <div className="flex">
                {/* Time Column */}
                <div className="w-16 flex-shrink-0 border-r bg-hit-gray-50">
                  {timeSlots.map((time, index) => (
                    <div
                      key={time}
                      className={cn(
                        'h-16 flex items-start justify-end pr-2 pt-0.5 text-xs text-hit-gray-500',
                        index !== 0 && 'border-t border-dashed border-hit-gray-200'
                      )}
                    >
                      {time}
                    </div>
                  ))}
                </div>

                {/* Events Area */}
                <div className="relative flex-1">
                  {/* Grid lines */}
                  {timeSlots.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'h-16',
                        index !== 0 && 'border-t border-dashed border-hit-gray-200'
                      )}
                    />
                  ))}

                  {/* Events */}
                  <div className="absolute inset-0 p-1">
                    {dayEvents.map((event, eventIndex) => {
                      const position = getEventPosition(event)
                      // Simple collision detection - offset overlapping events
                      const overlappingEvents = dayEvents.filter((e, i) => {
                        if (i >= eventIndex) return false
                        const eStart = new Date(e.timeStart).getTime()
                        const eEnd = e.timeEnd
                          ? new Date(e.timeEnd).getTime()
                          : eStart + 30 * 60 * 1000
                        const eventStart = new Date(event.timeStart).getTime()
                        const eventEnd = event.timeEnd
                          ? new Date(event.timeEnd).getTime()
                          : eventStart + 30 * 60 * 1000
                        return eventStart < eEnd && eventEnd > eStart
                      })
                      const leftOffset = overlappingEvents.length * 20

                      return (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="absolute block"
                          style={{
                            top: position.top,
                            height: position.height,
                            left: `${leftOffset}%`,
                            right: '4px',
                            minHeight: '60px',
                          }}
                        >
                          <div
                            className={cn(
                              'h-full rounded-md border p-2 transition-shadow hover:shadow-md overflow-hidden',
                              'bg-white border-l-4',
                              eventTypeColors[event.eventType]?.replace('bg-', 'border-l-') ||
                                'border-l-gray-500'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-medium text-hit-gray-900 line-clamp-2">
                                {event.title}
                              </h3>
                              <Badge
                                className={cn(
                                  'flex-shrink-0 text-[10px] text-white',
                                  eventTypeColors[event.eventType] || 'bg-gray-500'
                                )}
                              >
                                {eventTypeLabels[event.eventType]?.slice(0, 4) ||
                                  event.eventType.slice(0, 4)}
                              </Badge>
                            </div>

                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-hit-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatEventTimeRange(event.timeStart, event.timeEnd)}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location.buildingName}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        {Object.entries(eventTypeLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={cn('h-3 w-3 rounded', eventTypeColors[key])} />
            <span className="text-hit-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
