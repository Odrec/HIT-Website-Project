'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useSchedule, type ScheduleEvent } from '@/contexts/schedule-context'
import {
  SCHEDULE_PRIORITY_LABELS,
  SCHEDULE_PRIORITY_ORDER,
  type SchedulePriority,
} from '@/types/schedule'
import { formatEventTimeRange, formatEventDateLong, isSameEventDay } from '@/lib/event-time'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, MapPin, AlertTriangle, Trash2, Footprints } from 'lucide-react'
import { useScheduleTravelWarnings } from '@/hooks/use-schedule-travel-warnings'

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

const PRIORITY_BADGE_CLASS: Record<SchedulePriority, string> = {
  HIGH: 'bg-red-100 text-red-800 border-red-200',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
}

// Time slots for the day view (8:00 - 18:00)
const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8
  const minute = (i % 2) * 30
  return {
    hour,
    minute,
    label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
  }
})

interface TimeSlotEvent {
  scheduleEvent: ScheduleEvent
  startSlot: number
  endSlot: number
  duration: number
  hasConflict: boolean
}

type MobileSegment =
  | { type: 'timeline'; events: TimeSlotEvent[]; startSlot: number; endSlot: number }
  | { type: 'cluster'; events: TimeSlotEvent[] }

export function ScheduleTimeline({
  selectedDate,
  showControls = true,
  compact = false,
  className,
}: ScheduleTimelineProps) {
  const { state, removeEvent, updatePriority, getConflicts } = useSchedule()
  const travelWarnings = useScheduleTravelWarnings(state.items)
  const travelWarningByEventId = useMemo(() => {
    const m = new Map<string, (typeof travelWarnings)[number]>()
    for (const w of travelWarnings) m.set(w.toEvent.eventId, w)
    return m
  }, [travelWarnings])

  // Get events for the selected date, split into timeline and Infostände
  const { timelineEvents, infostands } = useMemo(() => {
    const filtered = selectedDate
      ? state.items.filter((item) => {
          if (!item.event.timeStart) return false
          return isSameEventDay(item.event.timeStart, selectedDate)
        })
      : state.items

    return {
      timelineEvents: filtered.filter((item) => item.event.eventType !== 'INFOSTAND'),
      infostands: filtered.filter((item) => item.event.eventType === 'INFOSTAND'),
    }
  }, [state.items, selectedDate])

  // Map events to time slots
  const timeSlotEvents = useMemo(() => {
    const conflicts = getConflicts()
    const conflictEventIds = new Set<string>()
    conflicts.forEach((c) => {
      conflictEventIds.add(c.event1.eventId)
      conflictEventIds.add(c.event2.eventId)
    })

    return timelineEvents
      .map((scheduleEvent) => {
        if (!scheduleEvent.event.timeStart) return null

        // Event timestamps are stored as Berlin wall-clock values whose UTC
        // components carry the hour/minute — see src/lib/event-time.ts. Read
        // UTC parts so slot positions are independent of the viewer's TZ.
        const startTime = new Date(scheduleEvent.event.timeStart)
        const endTime = scheduleEvent.event.timeEnd
          ? new Date(scheduleEvent.event.timeEnd)
          : new Date(startTime.getTime() + 60 * 60 * 1000) // Default 1 hour

        const startMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes()
        const endMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes()

        // Calculate slot positions (30-min slots starting at 8:00)
        const startSlot = Math.max(0, Math.floor((startMinutes - 480) / 30))
        const endSlot = Math.min(20, Math.ceil((endMinutes - 480) / 30))
        const duration = endSlot - startSlot

        // Visual end slot accounts for minimum card height (2 slots = 96px)
        const visualEndSlot = Math.max(endSlot, startSlot + 2)

        return {
          scheduleEvent,
          startSlot,
          endSlot: visualEndSlot,
          duration: Math.max(2, duration),
          hasConflict: conflictEventIds.has(scheduleEvent.eventId),
        } as TimeSlotEvent
      })
      .filter((e): e is TimeSlotEvent => e !== null)
      .sort((a, b) => a.startSlot - b.startSlot)
  }, [timelineEvents, getConflicts])

  // Group overlapping events into clusters
  const clusters = useMemo<TimeSlotEvent[][]>(() => {
    if (timeSlotEvents.length === 0) return []
    const result: TimeSlotEvent[][] = []
    let current: TimeSlotEvent[] = [timeSlotEvents[0]]
    let currentEnd = timeSlotEvents[0].endSlot
    for (let i = 1; i < timeSlotEvents.length; i++) {
      const event = timeSlotEvents[i]
      if (event.startSlot < currentEnd) {
        current.push(event)
        currentEnd = Math.max(currentEnd, event.endSlot)
      } else {
        result.push(current)
        current = [event]
        currentEnd = event.endSlot
      }
    }
    result.push(current)
    return result
  }, [timeSlotEvents])

  // Desktop: assign column positions within each cluster
  const layoutItems = useMemo(() => {
    return clusters.flatMap((cluster) => {
      const columns: TimeSlotEvent[][] = []
      cluster.forEach((event) => {
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

      const numCols = columns.length
      return columns.flatMap((col, colIdx) => col.map((event) => ({ event, colIdx, numCols })))
    })
  }, [clusters])

  // Mobile: alternate timeline-grids (single events) with stacked clusters
  // (overlapping events). Single-event clusters bunched together stay in a
  // shared mini-timeline; conflict clusters break out as full-width cards.
  const mobileSegments = useMemo<MobileSegment[]>(() => {
    const segments: MobileSegment[] = []
    let buf: TimeSlotEvent[] = []
    const flush = () => {
      if (buf.length === 0) return
      const startSlot = Math.min(...buf.map((e) => e.startSlot))
      const endSlot = Math.max(...buf.map((e) => e.endSlot))
      segments.push({ type: 'timeline', events: buf, startSlot, endSlot })
      buf = []
    }
    for (const cluster of clusters) {
      if (cluster.length === 1) {
        buf.push(cluster[0])
      } else {
        flush()
        segments.push({ type: 'cluster', events: cluster })
      }
    }
    flush()
    return segments
  }, [clusters])

  const handleRemoveEvent = (eventId: string) => {
    removeEvent(eventId)
  }

  // Compact timeline cards can't fit the full 3-button radiogroup, so the
  // priority is shown as a single always-visible badge that cycles
  // Hoch → Mittel → Niedrig on click. This keeps the control visible and
  // consistent on every card regardless of its height.
  const cyclePriority = (eventId: string, current: SchedulePriority) => {
    const idx = SCHEDULE_PRIORITY_ORDER.indexOf(current)
    const next = SCHEDULE_PRIORITY_ORDER[(idx + 1) % SCHEDULE_PRIORITY_ORDER.length]
    updatePriority(eventId, next)
  }

  const renderEventCardBody = (item: TimeSlotEvent) => (
    // Short cards clip their content (fixed height + overflow-hidden), so the
    // title attribute exposes the full title / time / location on hover.
    <CardContent
      className="p-0 h-full flex flex-col"
      title={[
        item.scheduleEvent.event.title,
        item.scheduleEvent.event.timeStart
          ? formatEventTimeRange(
              item.scheduleEvent.event.timeStart,
              item.scheduleEvent.event.timeEnd
            )
          : null,
        item.scheduleEvent.event.building
          ? `${item.scheduleEvent.event.building.name}${
              item.scheduleEvent.event.room?.name ? `, ${item.scheduleEvent.event.room.name}` : ''
            }`
          : null,
      ]
        .filter(Boolean)
        .join('\n')}
    >
      {/* Event header */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex-grow min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1">
            <Badge
              variant="outline"
              className={cn('text-xs', eventTypeColors[item.scheduleEvent.event.eventType])}
            >
              {eventTypeLabels[item.scheduleEvent.event.eventType]}
            </Badge>
            {/* Priority — single compact badge at the top so it stays visible
                even on short cards; click cycles Hoch → Mittel → Niedrig. The
                full radiogroup lives in the list view. */}
            {showControls && !compact && (
              <button
                type="button"
                onClick={() =>
                  cyclePriority(item.scheduleEvent.eventId, item.scheduleEvent.priority)
                }
                title="Priorität ändern (Hoch / Mittel / Niedrig)"
                aria-label={`Priorität: ${SCHEDULE_PRIORITY_LABELS[item.scheduleEvent.priority]} – klicken zum Ändern`}
                className={cn(
                  'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium leading-tight transition-colors hover:opacity-80',
                  PRIORITY_BADGE_CLASS[item.scheduleEvent.priority]
                )}
              >
                Prio: {SCHEDULE_PRIORITY_LABELS[item.scheduleEvent.priority]}
              </button>
            )}
          </div>
          <Link href={`/events/${item.scheduleEvent.event.id}`} className="group/link">
            {/* No own title attr — the card-level tooltip (title + time +
                location) applies uniformly, including over the title text. */}
            <h4
              className={cn(
                'font-medium line-clamp-3 break-words group-hover/link:underline',
                compact ? 'text-xs' : 'text-sm'
              )}
            >
              {item.scheduleEvent.event.title}
            </h4>
          </Link>
        </div>

        {/* Conflict warning + travel warning + always-visible remove button */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {item.hasConflict && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" aria-label="Zeitkonflikt" />
          )}
          {travelWarningByEventId.get(item.scheduleEvent.eventId) && (
            <span
              title={`Knappe Reisezeit: ${
                travelWarningByEventId.get(item.scheduleEvent.eventId)!.travelMinutes
              } Min Fußweg von ${
                travelWarningByEventId.get(item.scheduleEvent.eventId)!.fromBuildingName
              }, aber nur ${
                travelWarningByEventId.get(item.scheduleEvent.eventId)!.gapMinutes
              } Min Pause.`}
            >
              <Footprints className="h-4 w-4 text-destructive" aria-label="Knappe Reisezeit" />
            </span>
          )}
          {showControls && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleRemoveEvent(item.scheduleEvent.eventId)}
              title="Aus Stundenplan entfernen"
              aria-label="Aus Stundenplan entfernen"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Event details */}
      {!compact && (
        <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
          {item.scheduleEvent.event.timeStart && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>
                {formatEventTimeRange(
                  item.scheduleEvent.event.timeStart,
                  item.scheduleEvent.event.timeEnd
                )}
              </span>
            </div>
          )}
          {item.scheduleEvent.event.building && (
            <div
              className="flex items-center gap-1"
              title={`${item.scheduleEvent.event.building.name}${
                item.scheduleEvent.event.room?.name ? `, ${item.scheduleEvent.event.room.name}` : ''
              }`}
            >
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {item.scheduleEvent.event.building.name}
                {item.scheduleEvent.event.room?.name && `, ${item.scheduleEvent.event.room.name}`}
              </span>
            </div>
          )}
        </div>
      )}
    </CardContent>
  )

  if (timelineEvents.length === 0 && infostands.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {selectedDate
            ? `Keine Events für ${formatEventDateLong(selectedDate)}`
            : 'Noch keine Events in deinem Stundenplan'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Füge Events hinzu, um deinen persönlichen Stundenplan zu erstellen
        </p>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Desktop timeline (≥ md): column-based layout */}
      <div className="hidden md:flex">
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
            {layoutItems.map(({ event: item, colIdx, numCols }) => {
              const columnWidth = 100 / numCols
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
                  {renderEventCardBody(item)}
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile timeline (< md): conflict groups break out as full-width
          stacked cards under a warning header; non-overlapping events stay in
          a mini-timeline grid. */}
      <div className="md:hidden space-y-3">
        {mobileSegments.map((seg, segIdx) => {
          if (seg.type === 'timeline') {
            const slotCount = seg.endSlot - seg.startSlot
            return (
              <div key={`tl-${segIdx}`} className="flex">
                <div className="flex-shrink-0 w-14 pr-2">
                  {Array.from({ length: slotCount }, (_, i) => {
                    const globalIdx = seg.startSlot + i
                    const slot = TIME_SLOTS[globalIdx]
                    return (
                      <div
                        key={i}
                        className={cn(
                          'h-12 text-xs flex items-start justify-end pr-2',
                          globalIdx % 2 === 0
                            ? 'text-muted-foreground font-medium'
                            : 'text-muted-foreground/50'
                        )}
                      >
                        {globalIdx % 2 === 0 && slot?.label}
                      </div>
                    )
                  })}
                </div>
                <div className="flex-grow relative">
                  <div className="absolute inset-0">
                    {Array.from({ length: slotCount }, (_, i) => {
                      const globalIdx = seg.startSlot + i
                      return (
                        <div
                          key={i}
                          className={cn(
                            'h-12 border-t',
                            globalIdx % 2 === 0 ? 'border-border' : 'border-border/50'
                          )}
                        />
                      )
                    })}
                  </div>
                  <div className="relative" style={{ minHeight: `${slotCount * 48}px` }}>
                    {seg.events.map((item) => {
                      const top = (item.startSlot - seg.startSlot) * 48
                      const height = item.duration * 48
                      return (
                        <Card
                          key={item.scheduleEvent.id}
                          className={cn(
                            'absolute overflow-hidden transition-all left-0 right-1',
                            compact ? 'p-1' : 'p-2'
                          )}
                          style={{ top: `${top}px`, height: `${height - 4}px` }}
                        >
                          {renderEventCardBody(item)}
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          }

          // Conflict cluster — full-width stack under a warning header.
          const earliestStart = seg.events.reduce<Date | null>((acc, e) => {
            const t = e.scheduleEvent.event.timeStart
            if (!t) return acc
            if (!acc) return t
            return t < acc ? t : acc
          }, null)
          const latestEnd = seg.events.reduce<Date | null>((acc, e) => {
            const t = e.scheduleEvent.event.timeEnd ?? e.scheduleEvent.event.timeStart
            if (!t) return acc
            if (!acc) return t
            return t > acc ? t : acc
          }, null)

          return (
            <div key={`cl-${segIdx}`} className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg text-yellow-800 dark:text-yellow-200 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  {seg.events.length} überlappende Events
                  {earliestStart &&
                    ` · ${formatEventTimeRange(earliestStart, latestEnd ?? undefined)}`}
                </span>
              </div>
              {seg.events.map((item) => (
                <Card
                  key={item.scheduleEvent.id}
                  className={cn('overflow-hidden ring-2 ring-yellow-500', compact ? 'p-2' : 'p-3')}
                >
                  {renderEventCardBody(item)}
                </Card>
              ))}
            </div>
          )
        })}
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

      {/* Travel-time warnings summary */}
      {travelWarnings.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <Footprints className="h-5 w-5" />
            <span className="font-medium">
              {travelWarnings.length} knappe Reisezeit
              {travelWarnings.length > 1 ? 'en' : ''} zwischen Veranstaltungen
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-red-700">
            {travelWarnings.map((w, idx) => (
              <li key={idx}>
                Von <span className="font-medium">{w.fromEvent.event.title}</span>
                {' ('}
                {w.fromBuildingName}
                {') zu '}
                <span className="font-medium">{w.toEvent.event.title}</span>
                {' ('}
                {w.toBuildingName}
                {'): nur '}
                {w.gapMinutes} Min Pause für ca. {w.travelMinutes} Min Fußweg
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Infostände section */}
      {infostands.length > 0 && (
        <div className="mt-6 border-t-2 border-dashed border-border pt-4">
          <h4 className="text-sm font-semibold text-pink-800 dark:text-pink-300 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Infostände ({infostands.length})
          </h4>
          <div className="space-y-2">
            {infostands.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-pink-50 dark:bg-pink-950/30 px-3 py-2"
              >
                <div className="flex-grow min-w-0">
                  <Link
                    href={`/events/${item.event.id}`}
                    className="font-medium text-sm hover:underline truncate block"
                  >
                    {item.event.title}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {item.event.timeStart && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatEventTimeRange(item.event.timeStart, item.event.timeEnd)}
                      </span>
                    )}
                    {item.event.building && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.event.building.name}
                      </span>
                    )}
                  </div>
                </div>
                {showControls && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => handleRemoveEvent(item.eventId)}
                    title="Entfernen"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
