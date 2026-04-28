/**
 * Travel-time warnings between consecutive schedule events.
 *
 * If a visitor adds two events in different buildings back-to-back, the gap
 * between them may be shorter than the actual walking time across campus.
 * This module identifies those pairs so the UI can warn the user.
 *
 * Rules:
 *  - Only confirmed-building events count. WISH-mode events (no concrete
 *    building yet) are skipped.
 *  - Infostände are skipped on both sides of a pair: they're all-day walk-ins,
 *    so their "time" slot is not load-bearing for travel planning.
 *  - The same building (by slug) is never a warning, regardless of room.
 *  - A buffer (default 5 min) is added on top of the raw walking time to
 *    account for finding the room, queueing, etc. If the gap is shorter than
 *    `walkMinutes + buffer`, it's a warning.
 *  - Pairs are processed in time order. A "consecutive" pair is the first
 *    later event for each event — overlapping events are detected separately
 *    by the conflict module.
 */
import type { ScheduleEvent } from '@/contexts/schedule-context'

export interface TravelRoute {
  fromSlug: string
  toSlug: string
  durationSeconds: number
}

export interface TravelWarning {
  /** Event you're leaving from */
  fromEvent: ScheduleEvent
  /** Event you're heading to */
  toEvent: ScheduleEvent
  fromBuildingName: string
  toBuildingName: string
  /** Minutes between fromEvent.timeEnd and toEvent.timeStart */
  gapMinutes: number
  /** Walking time (rounded up to whole minutes) */
  travelMinutes: number
  /** travelMinutes + buffer - gapMinutes, always positive when this is a warning */
  shortfallMinutes: number
}

export const TRAVEL_BUFFER_MINUTES = 5

export function travelRouteKey(fromSlug: string, toSlug: string): string {
  return `${fromSlug}__${toSlug}`
}

interface NormalizedItem {
  event: ScheduleEvent
  start: Date
  end: Date
  buildingSlug: string
  buildingName: string
}

function normalize(items: ScheduleEvent[]): NormalizedItem[] {
  const out: NormalizedItem[] = []
  for (const item of items) {
    const ev = item.event
    if (ev.eventType === 'INFOSTAND') continue
    if (!ev.timeStart || !ev.timeEnd) continue
    if (!ev.building?.slug) continue
    const start = new Date(ev.timeStart)
    const end = new Date(ev.timeEnd)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue
    out.push({
      event: item,
      start,
      end,
      buildingSlug: ev.building.slug,
      buildingName: ev.building.name,
    })
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime())
}

export function detectTravelWarnings(
  items: ScheduleEvent[],
  routes: Map<string, TravelRoute>,
  bufferMinutes: number = TRAVEL_BUFFER_MINUTES
): TravelWarning[] {
  const sorted = normalize(items)
  const warnings: TravelWarning[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i]
    const to = sorted[i + 1]

    // Same building — no travel needed
    if (from.buildingSlug === to.buildingSlug) continue

    // Overlapping events are conflicts, not travel issues
    const gapMs = to.start.getTime() - from.end.getTime()
    if (gapMs < 0) continue

    const route = routes.get(travelRouteKey(from.buildingSlug, to.buildingSlug))
    if (!route) continue

    const gapMinutes = Math.floor(gapMs / 60_000)
    const travelMinutes = Math.ceil(route.durationSeconds / 60)
    const required = travelMinutes + bufferMinutes
    if (gapMinutes >= required) continue

    warnings.push({
      fromEvent: from.event,
      toEvent: to.event,
      fromBuildingName: from.buildingName,
      toBuildingName: to.buildingName,
      gapMinutes,
      travelMinutes,
      shortfallMinutes: required - gapMinutes,
    })
  }

  return warnings
}

/**
 * List the unique (from, to) building-slug pairs the schedule needs route data
 * for. UI uses this to fetch only what's required.
 */
export function uniqueTravelPairs(items: ScheduleEvent[]): { from: string; to: string }[] {
  const sorted = normalize(items)
  const seen = new Set<string>()
  const out: { from: string; to: string }[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i]
    const to = sorted[i + 1]
    if (from.buildingSlug === to.buildingSlug) continue
    if (to.start.getTime() < from.end.getTime()) continue
    const key = travelRouteKey(from.buildingSlug, to.buildingSlug)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ from: from.buildingSlug, to: to.buildingSlug })
  }
  return out
}
