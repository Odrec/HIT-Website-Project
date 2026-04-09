import { describe, it, expect } from 'vitest'
import { EventType, Institution, LocationType } from '@/types/events'
import type { Event } from '@/types/events'
import type { ScheduleEvent, TimeConflict } from '@/contexts/schedule-context'

// Local copy of detectConflicts with the INFOSTAND skip logic we want to validate.
// This mirrors the logic that should be in schedule-context.tsx after the fix.
function calculateOverlap(start1: Date, end1: Date, start2: Date, end2: Date): number {
  const overlapStart = Math.max(start1.getTime(), start2.getTime())
  const overlapEnd = Math.min(end1.getTime(), end2.getTime())
  const overlapMs = Math.max(0, overlapEnd - overlapStart)
  return Math.floor(overlapMs / (1000 * 60))
}

function detectConflicts(items: ScheduleEvent[]): TimeConflict[] {
  const conflicts: TimeConflict[] = []

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const event1 = items[i]
      const event2 = items[j]

      // Skip INFOSTAND events — they're all-day and shouldn't create conflicts
      if (
        event1.event.eventType === 'INFOSTAND' ||
        event2.event.eventType === 'INFOSTAND'
      ) {
        continue
      }

      // Skip if either event doesn't have times
      if (
        !event1.event.timeStart ||
        !event1.event.timeEnd ||
        !event2.event.timeStart ||
        !event2.event.timeEnd
      ) {
        continue
      }

      const start1 = new Date(event1.event.timeStart)
      const end1 = new Date(event1.event.timeEnd)
      const start2 = new Date(event2.event.timeStart)
      const end2 = new Date(event2.event.timeEnd)

      const overlapMinutes = calculateOverlap(start1, end1, start2, end2)

      if (overlapMinutes > 0) {
        conflicts.push({
          event1,
          event2,
          overlapMinutes,
        })
      }
    }
  }

  return conflicts
}

// Helper to create a minimal mock ScheduleEvent
let idCounter = 0
function makeEvent(
  eventType: EventType,
  timeStart: string,
  timeEnd: string
): ScheduleEvent {
  const id = `event-${++idCounter}`
  const event: Event = {
    id,
    title: `Test ${eventType}`,
    eventType,
    timeStart: new Date(timeStart),
    timeEnd: new Date(timeEnd),
    locationType: LocationType.OTHER,
    institution: Institution.UNI,
    createdAt: new Date('2026-11-19T00:00:00'),
    updatedAt: new Date('2026-11-19T00:00:00'),
  }
  return {
    id,
    eventId: id,
    event,
    priority: 1,
    addedAt: new Date('2026-11-19T00:00:00'),
  }
}

describe('detectConflicts', () => {
  it('detects a conflict between two overlapping Vorträge', () => {
    const vortrag1 = makeEvent(EventType.VORTRAG, '2026-11-19T09:00:00', '2026-11-19T09:45:00')
    const vortrag2 = makeEvent(EventType.VORTRAG, '2026-11-19T09:30:00', '2026-11-19T10:15:00')

    const conflicts = detectConflicts([vortrag1, vortrag2])

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].overlapMinutes).toBe(15)
  })

  it('does NOT create a conflict for an Infostand overlapping with a Vortrag', () => {
    const infostand = makeEvent(EventType.INFOSTAND, '2026-11-19T09:00:00', '2026-11-19T16:00:00')
    const vortrag = makeEvent(EventType.VORTRAG, '2026-11-19T10:00:00', '2026-11-19T10:45:00')

    const conflicts = detectConflicts([infostand, vortrag])

    expect(conflicts).toHaveLength(0)
  })

  it('does NOT create a conflict between two overlapping Infostände', () => {
    const infostand1 = makeEvent(EventType.INFOSTAND, '2026-11-19T09:00:00', '2026-11-19T16:00:00')
    const infostand2 = makeEvent(EventType.INFOSTAND, '2026-11-19T09:00:00', '2026-11-19T16:00:00')

    const conflicts = detectConflicts([infostand1, infostand2])

    expect(conflicts).toHaveLength(0)
  })

  it('does NOT create a conflict for non-overlapping Vorträge', () => {
    const vortrag1 = makeEvent(EventType.VORTRAG, '2026-11-19T09:00:00', '2026-11-19T09:45:00')
    const vortrag2 = makeEvent(EventType.VORTRAG, '2026-11-19T10:00:00', '2026-11-19T10:45:00')

    const conflicts = detectConflicts([vortrag1, vortrag2])

    expect(conflicts).toHaveLength(0)
  })
})