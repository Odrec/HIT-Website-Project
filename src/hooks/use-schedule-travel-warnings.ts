'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  detectTravelWarnings,
  travelRouteKey,
  uniqueTravelPairs,
  type TravelRoute,
  type TravelWarning,
} from '@/lib/schedule-travel'
import type { ScheduleEvent } from '@/contexts/schedule-context'

/**
 * Fetches walking-route durations for the current schedule and returns the
 * list of consecutive event pairs whose gap is too short to walk between
 * different buildings.
 *
 * Routes are fetched lazily, on demand, and cached in component state — once
 * a pair is fetched it stays in memory for the page's lifetime so re-renders
 * don't refetch.
 */
export function useScheduleTravelWarnings(items: ScheduleEvent[]): TravelWarning[] {
  const [routes, setRoutes] = useState<Map<string, TravelRoute>>(new Map())

  // Stable serialization of the pairs we need so the effect doesn't refire on
  // every render due to inline-object identity.
  const pairs = useMemo(() => uniqueTravelPairs(items), [items])
  const pairsKey = useMemo(() => pairs.map((p) => `${p.from}__${p.to}`).sort().join(','), [pairs])

  useEffect(() => {
    let cancelled = false
    const missing = pairs.filter((p) => !routes.has(travelRouteKey(p.from, p.to)))
    if (missing.length === 0) return

    Promise.all(
      missing.map(async (p) => {
        try {
          const res = await fetch(
            `/api/routes/directions?from=${encodeURIComponent(p.from)}&to=${encodeURIComponent(p.to)}`
          )
          if (!res.ok) return null
          const data = (await res.json()) as { durationSeconds?: number }
          if (typeof data.durationSeconds !== 'number') return null
          return {
            fromSlug: p.from,
            toSlug: p.to,
            durationSeconds: data.durationSeconds,
          } satisfies TravelRoute
        } catch {
          return null
        }
      })
    ).then((results) => {
      if (cancelled) return
      const next = new Map(routes)
      let added = false
      for (const r of results) {
        if (!r) continue
        const key = travelRouteKey(r.fromSlug, r.toSlug)
        if (!next.has(key)) {
          next.set(key, r)
          added = true
        }
      }
      if (added) setRoutes(next)
    })

    return () => {
      cancelled = true
    }
    // We intentionally depend on pairsKey (a stable string) not pairs (a fresh
    // array each render) and not routes (mutated inside).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairsKey])

  return useMemo(() => detectTravelWarnings(items, routes), [items, routes])
}
