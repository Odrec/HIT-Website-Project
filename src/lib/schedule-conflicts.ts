/**
 * Central schedule conflict detection.
 *
 * All conflict checks in the app — both client-side (ScheduleContext) and
 * server-side (recommendation-service) — must go through this module. Keeping
 * the logic in one place avoids regressions like the one where an Infostand
 * exclusion was added to one call site but missed at two others.
 *
 * Rules:
 *  - Two events conflict iff their [start, end) ranges overlap by > 0 minutes.
 *  - INFOSTAND events never conflict with anything. Infostände are all-day,
 *    walk-in stands; a visitor can drop by whenever, so they don't compete
 *    with scheduled events.
 *  - Events with missing start or end times never conflict.
 */

type DateInput = Date | string | number | null | undefined

/** Minimal shape required to check a pair for conflict. */
export interface ConflictEventLike {
  eventType: string
  timeStart?: DateInput
  timeEnd?: DateInput
}

/** Pure overlap math in minutes. */
export function calculateOverlapMinutes(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): number {
  const overlapStart = Math.max(start1.getTime(), start2.getTime())
  const overlapEnd = Math.min(end1.getTime(), end2.getTime())
  const overlapMs = Math.max(0, overlapEnd - overlapStart)
  return Math.floor(overlapMs / (1000 * 60))
}

function toDate(input: DateInput): Date | null {
  if (input == null) return null
  const d = input instanceof Date ? input : new Date(input)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Returns the overlap in minutes between two events, or 0 if the pair cannot
 * produce a conflict (either event is an Infostand, or either is missing
 * start/end times).
 */
export function eventPairOverlapMinutes(a: ConflictEventLike, b: ConflictEventLike): number {
  if (a.eventType === 'INFOSTAND' || b.eventType === 'INFOSTAND') return 0

  const start1 = toDate(a.timeStart)
  const end1 = toDate(a.timeEnd)
  const start2 = toDate(b.timeStart)
  const end2 = toDate(b.timeEnd)
  if (!start1 || !end1 || !start2 || !end2) return 0

  return calculateOverlapMinutes(start1, end1, start2, end2)
}

/** Convenience boolean wrapper around `eventPairOverlapMinutes`. */
export function eventsConflict(a: ConflictEventLike, b: ConflictEventLike): boolean {
  return eventPairOverlapMinutes(a, b) > 0
}

/**
 * Generic conflict detector. Works with any array whose items expose an event
 * via the provided accessor — so it can serve both `ScheduleEvent[]` (where
 * the event lives at `item.event`) and arrays of Prisma events (where the
 * item *is* the event).
 */
export function detectConflicts<T>(
  items: T[],
  getEvent: (item: T) => ConflictEventLike
): { item1: T; item2: T; overlapMinutes: number }[] {
  const conflicts: { item1: T; item2: T; overlapMinutes: number }[] = []

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const overlap = eventPairOverlapMinutes(getEvent(items[i]), getEvent(items[j]))
      if (overlap > 0) {
        conflicts.push({ item1: items[i], item2: items[j], overlapMinutes: overlap })
      }
    }
  }

  return conflicts
}
