'use client'

import Link from 'next/link'
import { Bookmark, ArrowLeft, Trash2 } from 'lucide-react'
import { useSchedule } from '@/contexts/schedule-context'
import { EventCard } from '@/components/events/EventCard'
import { Button } from '@/components/ui/button'

export default function MerklistePage() {
  const { state, clearWatchlist } = useSchedule()

  // Sort by start time; events without a time go last.
  const items = [...state.watchlist].sort((a, b) => {
    const ta = a.event.timeStart ? new Date(a.event.timeStart).getTime() : Number.POSITIVE_INFINITY
    const tb = b.event.timeStart ? new Date(b.event.timeStart).getTime() : Number.POSITIVE_INFINITY
    return ta - tb
  })

  const handleClear = () => {
    if (window.confirm('Möchtest du wirklich die ganze Merkliste leeren?')) {
      clearWatchlist()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-1 text-sm text-hit-gray-500 hover:text-hit-uni-500"
        >
          <ArrowLeft className="h-4 w-4" /> Zur Veranstaltungsübersicht
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-hit-gray-900">
            <Bookmark className="h-7 w-7 text-amber-500" />
            Meine Merkliste
            {items.length > 0 && (
              <span className="text-lg font-normal text-hit-gray-500">({items.length})</span>
            )}
          </h1>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="mr-2 h-4 w-4" />
              Merkliste leeren
            </Button>
          )}
        </div>
        <p className="mt-2 text-hit-gray-600">
          Gemerkte Veranstaltungen. Mit &bdquo;Zum Stundenplan&ldquo; übernimmst du eine
          Veranstaltung in deinen Stundenplan &ndash; sie verschwindet dann aus der Merkliste.
        </p>
      </div>

      {!state.isLoaded ? null : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hit-gray-300 py-16 text-center">
          <Bookmark className="mx-auto h-12 w-12 text-hit-gray-300" />
          <h2 className="mt-4 text-lg font-medium text-hit-gray-900">
            Deine Merkliste ist noch leer
          </h2>
          <p className="mt-2 text-hit-gray-600">
            Tippe bei einer Veranstaltung auf &bdquo;Merken&ldquo;, um sie hier zu sammeln.
          </p>
          <Link href="/events" className="mt-4 inline-block">
            <Button variant="uni">Veranstaltungen entdecken</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const e = item.event
            const cardEvent = {
              id: e.id,
              title: e.title,
              description: e.description ?? null,
              eventType: e.eventType as string,
              timeStart: e.timeStart ? e.timeStart.toISOString() : '',
              timeEnd: e.timeEnd ? e.timeEnd.toISOString() : null,
              institution: e.institution as string,
              location: null,
              lecturers: (e.lecturers ?? []).map((l) => ({
                id: l.id,
                firstName: l.firstName,
                lastName: l.lastName,
                title: l.title ?? null,
              })),
              studyPrograms: (e.studyPrograms ?? []).map((sp) => ({
                id: sp.id,
                name: sp.name,
                institution: sp.institution as string,
              })),
              meetingPoint: e.meetingPoint ?? null,
              photoUrl: e.photoUrl ?? null,
              locationHint: e.locationHint ?? null,
              building: e.building
                ? {
                    id: e.building.id,
                    slug: e.building.slug,
                    name: e.building.name,
                  }
                : null,
              room: e.room ? { id: e.room.id, name: e.room.name } : null,
            }
            // The list-view EventCard already renders both "Zum Stundenplan"
            // (promote — moves it out of the Merkliste) and the Merken toggle
            // (remove), so no extra action buttons are needed here.
            return <EventCard key={item.eventId} event={cardEvent} viewMode="list" />
          })}
        </div>
      )}
    </div>
  )
}
