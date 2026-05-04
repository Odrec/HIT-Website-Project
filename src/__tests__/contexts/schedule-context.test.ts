import { describe, it, expect } from 'vitest'
import { EventType, Institution } from '@/types/events'
import type { Event } from '@/types/events'
import { detectConflicts } from '@/lib/schedule-conflicts'

// Helper to create a minimal mock Event (matches the ConflictEventLike shape).
let idCounter = 0
function makeEvent(eventType: EventType, timeStart: string, timeEnd: string): Event {
  const id = `event-${++idCounter}`
  return {
    id,
    title: `Test ${eventType}`,
    eventType,
    timeStart: new Date(timeStart),
    timeEnd: new Date(timeEnd),
    institution: Institution.UNI,
    createdAt: new Date('2026-11-19T00:00:00'),
    updatedAt: new Date('2026-11-19T00:00:00'),
  }
}

describe('detectConflicts', () => {
  it('detects a conflict between two overlapping Vorträge', () => {
    const vortrag1 = makeEvent(EventType.VORTRAG, '2026-11-19T09:00:00', '2026-11-19T09:45:00')
    const vortrag2 = makeEvent(EventType.VORTRAG, '2026-11-19T09:30:00', '2026-11-19T10:15:00')

    const conflicts = detectConflicts([vortrag1, vortrag2], (e) => e)

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].overlapMinutes).toBe(15)
  })

  it('does NOT create a conflict for an Infostand overlapping with a Vortrag', () => {
    const infostand = makeEvent(EventType.INFOSTAND, '2026-11-19T09:00:00', '2026-11-19T16:00:00')
    const vortrag = makeEvent(EventType.VORTRAG, '2026-11-19T10:00:00', '2026-11-19T10:45:00')

    const conflicts = detectConflicts([infostand, vortrag], (e) => e)

    expect(conflicts).toHaveLength(0)
  })

  it('does NOT create a conflict between two overlapping Infostände', () => {
    const infostand1 = makeEvent(EventType.INFOSTAND, '2026-11-19T09:00:00', '2026-11-19T16:00:00')
    const infostand2 = makeEvent(EventType.INFOSTAND, '2026-11-19T09:00:00', '2026-11-19T16:00:00')

    const conflicts = detectConflicts([infostand1, infostand2], (e) => e)

    expect(conflicts).toHaveLength(0)
  })

  it('does NOT create a conflict for non-overlapping Vorträge', () => {
    const vortrag1 = makeEvent(EventType.VORTRAG, '2026-11-19T09:00:00', '2026-11-19T09:45:00')
    const vortrag2 = makeEvent(EventType.VORTRAG, '2026-11-19T10:00:00', '2026-11-19T10:45:00')

    const conflicts = detectConflicts([vortrag1, vortrag2], (e) => e)

    expect(conflicts).toHaveLength(0)
  })

  it('handles events with missing start or end times without crashing', () => {
    const vortrag = makeEvent(EventType.VORTRAG, '2026-11-19T09:00:00', '2026-11-19T09:45:00')
    const incomplete = makeEvent(EventType.VORTRAG, '2026-11-19T09:00:00', '2026-11-19T09:30:00')
    incomplete.timeEnd = undefined

    const conflicts = detectConflicts([vortrag, incomplete], (e) => e)

    expect(conflicts).toHaveLength(0)
  })
})
