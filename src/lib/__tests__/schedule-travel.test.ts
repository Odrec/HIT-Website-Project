import { describe, it, expect } from 'vitest'
import {
  detectTravelWarnings,
  detectProximity,
  travelRouteKey,
  uniqueTravelPairs,
  TRAVEL_BUFFER_MINUTES,
  type TravelRoute,
} from '../schedule-travel'
import type { ScheduleEvent } from '@/contexts/schedule-context'

function ev(opts: {
  id: string
  start: string
  end: string
  buildingSlug?: string | null
  buildingName?: string
  eventType?: string
}): ScheduleEvent {
  return {
    id: opts.id,
    eventId: opts.id,
    addedAt: new Date(),
    priority: 'MEDIUM',
    event: {
      id: opts.id,
      title: opts.id,
      eventType: opts.eventType ?? 'VORTRAG',
      timeStart: opts.start,
      timeEnd: opts.end,
      building: opts.buildingSlug
        ? {
            id: opts.buildingSlug,
            slug: opts.buildingSlug,
            name: opts.buildingName ?? opts.buildingSlug,
          }
        : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  }
}

function routesMap(entries: Array<[string, string, number]>): Map<string, TravelRoute> {
  const m = new Map<string, TravelRoute>()
  for (const [from, to, durationSeconds] of entries) {
    m.set(travelRouteKey(from, to), { fromSlug: from, toSlug: to, durationSeconds })
  }
  return m
}

describe('detectTravelWarnings', () => {
  it('returns empty when no items', () => {
    expect(detectTravelWarnings([], new Map())).toEqual([])
  })

  it('flags consecutive events in different buildings with insufficient gap', () => {
    const items = [
      ev({
        id: 'a',
        start: '2026-11-19T09:00',
        end: '2026-11-19T09:45',
        buildingSlug: 'schloss',
        buildingName: 'Schloss',
      }),
      ev({
        id: 'b',
        start: '2026-11-19T10:00',
        end: '2026-11-19T11:00',
        buildingSlug: 'cn-a',
        buildingName: 'Caprivi A',
      }),
    ]
    // 25-minute walk; gap is 15 min → shortfall of 25 + 5 - 15 = 15
    const warnings = detectTravelWarnings(items, routesMap([['schloss', 'cn-a', 25 * 60]]))
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatchObject({
      fromBuildingName: 'Schloss',
      toBuildingName: 'Caprivi A',
      gapMinutes: 15,
      travelMinutes: 25,
      shortfallMinutes: 15,
    })
  })

  it('does not flag when gap is sufficient', () => {
    const items = [
      ev({ id: 'a', start: '2026-11-19T09:00', end: '2026-11-19T09:30', buildingSlug: 'schloss' }),
      ev({ id: 'b', start: '2026-11-19T10:00', end: '2026-11-19T10:30', buildingSlug: 'cn-a' }),
    ]
    // 10-minute walk + 5-minute buffer = 15 min required; gap is 30 min → fine
    const warnings = detectTravelWarnings(items, routesMap([['schloss', 'cn-a', 10 * 60]]))
    expect(warnings).toEqual([])
  })

  it('does not flag same building', () => {
    const items = [
      ev({ id: 'a', start: '2026-11-19T09:00', end: '2026-11-19T09:30', buildingSlug: 'schloss' }),
      ev({ id: 'b', start: '2026-11-19T09:35', end: '2026-11-19T10:00', buildingSlug: 'schloss' }),
    ]
    const warnings = detectTravelWarnings(items, routesMap([]))
    expect(warnings).toEqual([])
  })

  it('skips Infostände on either side of a pair', () => {
    const items = [
      ev({
        id: 'info',
        start: '2026-11-19T09:00',
        end: '2026-11-19T16:00',
        buildingSlug: 'schloss',
        eventType: 'INFOSTAND',
      }),
      ev({ id: 'b', start: '2026-11-19T16:05', end: '2026-11-19T16:30', buildingSlug: 'cn-a' }),
    ]
    const warnings = detectTravelWarnings(items, routesMap([['schloss', 'cn-a', 30 * 60]]))
    expect(warnings).toEqual([])
  })

  it('skips events without confirmed building', () => {
    const items = [
      ev({ id: 'a', start: '2026-11-19T09:00', end: '2026-11-19T09:30', buildingSlug: null }),
      ev({ id: 'b', start: '2026-11-19T09:35', end: '2026-11-19T10:00', buildingSlug: 'cn-a' }),
    ]
    const warnings = detectTravelWarnings(items, routesMap([]))
    expect(warnings).toEqual([])
  })

  it('skips overlapping events (those are conflicts, not travel issues)', () => {
    const items = [
      ev({ id: 'a', start: '2026-11-19T09:00', end: '2026-11-19T10:00', buildingSlug: 'schloss' }),
      ev({ id: 'b', start: '2026-11-19T09:30', end: '2026-11-19T10:30', buildingSlug: 'cn-a' }),
    ]
    const warnings = detectTravelWarnings(items, routesMap([['schloss', 'cn-a', 30 * 60]]))
    expect(warnings).toEqual([])
  })

  it('does nothing if the route is missing from the map', () => {
    const items = [
      ev({ id: 'a', start: '2026-11-19T09:00', end: '2026-11-19T09:30', buildingSlug: 'schloss' }),
      ev({ id: 'b', start: '2026-11-19T09:35', end: '2026-11-19T10:00', buildingSlug: 'cn-a' }),
    ]
    const warnings = detectTravelWarnings(items, new Map())
    expect(warnings).toEqual([])
  })

  it('treats exactly travel + buffer as fine (boundary)', () => {
    const items = [
      ev({ id: 'a', start: '2026-11-19T09:00', end: '2026-11-19T09:30', buildingSlug: 'schloss' }),
      ev({ id: 'b', start: '2026-11-19T09:45', end: '2026-11-19T10:00', buildingSlug: 'cn-a' }),
    ]
    // 10-minute walk + 5 buffer = 15; gap is exactly 15 → no warning
    const warnings = detectTravelWarnings(items, routesMap([['schloss', 'cn-a', 10 * 60]]))
    expect(warnings).toEqual([])
  })
})

describe('uniqueTravelPairs', () => {
  it('returns one entry per consecutive cross-building pair', () => {
    const items = [
      ev({ id: 'a', start: '2026-11-19T09:00', end: '2026-11-19T09:30', buildingSlug: 'schloss' }),
      ev({ id: 'b', start: '2026-11-19T10:00', end: '2026-11-19T10:30', buildingSlug: 'cn-a' }),
      ev({
        id: 'c',
        start: '2026-11-19T11:00',
        end: '2026-11-19T11:30',
        buildingSlug: 'westerberg',
      }),
    ]
    expect(uniqueTravelPairs(items)).toEqual([
      { from: 'schloss', to: 'cn-a' },
      { from: 'cn-a', to: 'westerberg' },
    ])
  })

  it('deduplicates repeated pairs', () => {
    const items = [
      ev({ id: 'a', start: '2026-11-19T09:00', end: '2026-11-19T09:30', buildingSlug: 'schloss' }),
      ev({ id: 'b', start: '2026-11-19T10:00', end: '2026-11-19T10:30', buildingSlug: 'cn-a' }),
      ev({ id: 'c', start: '2026-11-19T11:00', end: '2026-11-19T11:30', buildingSlug: 'schloss' }),
      ev({ id: 'd', start: '2026-11-19T12:00', end: '2026-11-19T12:30', buildingSlug: 'cn-a' }),
    ]
    expect(uniqueTravelPairs(items)).toEqual([
      { from: 'schloss', to: 'cn-a' },
      { from: 'cn-a', to: 'schloss' },
    ])
  })

  it('uses the configured buffer', () => {
    const items = [
      ev({ id: 'a', start: '2026-11-19T09:00', end: '2026-11-19T09:30', buildingSlug: 'schloss' }),
      ev({ id: 'b', start: '2026-11-19T09:42', end: '2026-11-19T10:00', buildingSlug: 'cn-a' }),
    ]
    // 10-min walk; gap is 12 min. Default buffer = 5 → required 15, shortfall 3.
    const warnings = detectTravelWarnings(items, routesMap([['schloss', 'cn-a', 10 * 60]]))
    expect(warnings[0].shortfallMinutes).toBe(3)
    // With a 1-min buffer, required is 11; gap 12 is fine.
    const warningsLowBuffer = detectTravelWarnings(
      items,
      routesMap([['schloss', 'cn-a', 10 * 60]]),
      1
    )
    expect(warningsLowBuffer).toEqual([])
  })
})

describe('TRAVEL_BUFFER_MINUTES', () => {
  it('exports the default buffer constant', () => {
    expect(TRAVEL_BUFFER_MINUTES).toBeGreaterThan(0)
  })
})

describe('detectProximity', () => {
  it('returns empty when no items', () => {
    expect(detectProximity([], new Map())).toEqual([])
  })

  it('marks a same-building consecutive pair as same-building (no route needed)', () => {
    const items = [
      ev({
        id: 'a',
        start: '2026-11-19T09:00',
        end: '2026-11-19T09:45',
        buildingSlug: 'schloss',
        buildingName: 'Schloss',
      }),
      ev({
        id: 'b',
        start: '2026-11-19T10:00',
        end: '2026-11-19T10:45',
        buildingSlug: 'schloss',
        buildingName: 'Schloss',
      }),
    ]
    const markers = detectProximity(items, new Map())
    expect(markers).toHaveLength(1)
    expect(markers[0]).toMatchObject({
      kind: 'same-building',
      walkMinutes: 0,
      fromBuildingName: 'Schloss',
      toBuildingName: 'Schloss',
    })
  })

  it('marks a different-building pair within 5 min as close', () => {
    const items = [
      ev({
        id: 'a',
        start: '2026-11-19T09:00',
        end: '2026-11-19T09:45',
        buildingSlug: 'schloss',
        buildingName: 'Schloss',
      }),
      ev({
        id: 'b',
        start: '2026-11-19T10:00',
        end: '2026-11-19T10:45',
        buildingSlug: 'cn-a',
        buildingName: 'Caprivi A',
      }),
    ]
    const markers = detectProximity(items, routesMap([['schloss', 'cn-a', 4 * 60]]))
    expect(markers).toHaveLength(1)
    expect(markers[0]).toMatchObject({
      kind: 'close',
      walkMinutes: 4,
      fromBuildingName: 'Schloss',
      toBuildingName: 'Caprivi A',
    })
  })

  it('does NOT mark a different-building pair farther than 5 min', () => {
    const items = [
      ev({ id: 'a', start: '2026-11-19T09:00', end: '2026-11-19T09:45', buildingSlug: 'schloss' }),
      ev({ id: 'b', start: '2026-11-19T10:00', end: '2026-11-19T10:45', buildingSlug: 'cn-a' }),
    ]
    expect(detectProximity(items, routesMap([['schloss', 'cn-a', 6 * 60]]))).toEqual([])
  })

  it('treats exactly 5 min as close (boundary)', () => {
    const items = [
      ev({ id: 'a', start: '2026-11-19T09:00', end: '2026-11-19T09:45', buildingSlug: 'schloss' }),
      ev({ id: 'b', start: '2026-11-19T10:00', end: '2026-11-19T10:45', buildingSlug: 'cn-a' }),
    ]
    expect(detectProximity(items, routesMap([['schloss', 'cn-a', 5 * 60]]))).toHaveLength(1)
  })

  it('does NOT mark overlapping events', () => {
    const items = [
      ev({ id: 'a', start: '2026-11-19T09:00', end: '2026-11-19T10:00', buildingSlug: 'schloss' }),
      ev({ id: 'b', start: '2026-11-19T09:30', end: '2026-11-19T10:30', buildingSlug: 'cn-a' }),
    ]
    expect(detectProximity(items, routesMap([['schloss', 'cn-a', 3 * 60]]))).toEqual([])
  })

  it('skips Infostände on either side', () => {
    const items = [
      ev({
        id: 'a',
        start: '2026-11-19T09:00',
        end: '2026-11-19T16:00',
        buildingSlug: 'schloss',
        eventType: 'INFOSTAND',
      }),
      ev({ id: 'b', start: '2026-11-19T10:00', end: '2026-11-19T10:45', buildingSlug: 'cn-a' }),
    ]
    expect(detectProximity(items, routesMap([['schloss', 'cn-a', 3 * 60]]))).toEqual([])
  })

  it('skips a different-building pair with no cached route', () => {
    const items = [
      ev({ id: 'a', start: '2026-11-19T09:00', end: '2026-11-19T09:45', buildingSlug: 'schloss' }),
      ev({ id: 'b', start: '2026-11-19T10:00', end: '2026-11-19T10:45', buildingSlug: 'cn-a' }),
    ]
    expect(detectProximity(items, new Map())).toEqual([])
  })
})
