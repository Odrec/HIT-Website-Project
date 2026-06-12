'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { EventCard } from '@/components/events/EventCard'

type PublicEvent = Parameters<typeof EventCard>[0]['event']

/**
 * Fetches and renders the events for one Lehramt accordion via the public
 * events API (active edition + PUBLISHED scoping happens server-side).
 * `query` example: { lehramtTyp: 'GYMNASIUM' } or { studyProgramId: '…' }.
 */
export function LehramtEventsSection({ query }: { query: Record<string, string> }) {
  const [events, setEvents] = useState<PublicEvent[] | null>(null)
  const [error, setError] = useState(false)
  const queryKey = JSON.stringify(query)

  useEffect(() => {
    const params = new URLSearchParams({
      ...JSON.parse(queryKey),
      pageSize: '50',
      sortBy: 'timeStart',
      sortOrder: 'asc',
    })
    let cancelled = false
    fetch(`/api/events/public?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then((data) => {
        if (!cancelled) setEvents(data.events ?? [])
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setEvents([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [queryKey])

  if (events === null) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-hit-uni-500" />
      </div>
    )
  }
  if (error) {
    return (
      <p className="text-sm text-hit-gray-500">Veranstaltungen konnten nicht geladen werden.</p>
    )
  }
  if (events.length === 0) {
    return (
      <p className="text-sm text-hit-gray-500">
        Zurzeit sind hier keine Veranstaltungen eingetragen.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {events.map((event) => (
        <EventCard key={event.id} event={event} viewMode="grid" />
      ))}
    </div>
  )
}
