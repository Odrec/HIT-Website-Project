'use client'

import { useEffect, useState } from 'react'
import { ArrowDownAZ, BookOpen, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventCard } from '@/components/events/EventCard'

interface Event {
  id: string
  title: string
  description: string | null
  eventType: string
  timeStart: string
  timeEnd: string | null
  locationType: string
  locationDetails: string | null
  roomRequest: string | null
  meetingPoint: string | null
  additionalInfo: string | null
  photoUrl: string | null
  institution: string
  location: {
    id: string
    buildingName: string
    roomNumber: string | null
    address: string | null
  } | null
  lecturers: Array<{ id: string; firstName: string; lastName: string; title: string | null }>
  studyPrograms: Array<{
    id: string
    name: string
    institution: string
    clusters?: Array<{ id: string; name: string }>
  }>
  isCrossProgram?: boolean
}

export function AZViewClient() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events/public?pageSize=500&sortBy=title&sortOrder=asc')
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-hit-uni-500" />
      </div>
    )
  }

  // Build letter -> programs -> events map
  const letterMap = new Map<string, Map<string, { name: string; events: Map<string, Event> }>>()
  const noProgram = new Map<string, Event>()
  const crossProgram = new Map<string, Event>()

  for (const event of events) {
    if (event.isCrossProgram) {
      crossProgram.set(event.id, event)
      continue
    }
    if (event.studyPrograms.length === 0) {
      noProgram.set(event.id, event)
      continue
    }
    for (const sp of event.studyPrograms) {
      const letter = sp.name.charAt(0).toUpperCase()
      if (!letterMap.has(letter)) letterMap.set(letter, new Map())
      const programs = letterMap.get(letter)!
      if (!programs.has(sp.id)) programs.set(sp.id, { name: sp.name, events: new Map() })
      programs.get(sp.id)!.events.set(event.id, event)
    }
  }

  const sortedLetters = Array.from(letterMap.keys()).sort((a, b) => a.localeCompare(b, 'de'))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1">
        {sortedLetters.map((letter) => (
          <a
            key={letter}
            href={`#letter-${letter}`}
            className="flex h-8 w-8 items-center justify-center rounded bg-hit-uni-50 text-sm font-semibold text-hit-uni-700 hover:bg-hit-uni-100"
          >
            {letter}
          </a>
        ))}
      </div>

      {sortedLetters.map((letter) => {
        const programs = Array.from(letterMap.get(letter)!.values()).sort((a, b) =>
          a.name.localeCompare(b.name, 'de')
        )
        return (
          <div key={letter} id={`letter-${letter}`}>
            <h2 className="mb-3 text-2xl font-bold text-hit-uni-600">{letter}</h2>
            <div className="space-y-4">
              {programs.map((program) => (
                <Card key={program.name}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ArrowDownAZ className="h-4 w-4 text-hit-uni-500" />
                      {program.name}
                      <span className="text-sm font-normal text-hit-gray-500">
                        ({program.events.size})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      {Array.from(program.events.values()).map((e) => (
                        <EventCard key={e.id} event={e} viewMode="list" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}

      {noProgram.size > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-hit-gray-400" />
              Ohne Studiengangszuordnung
              <span className="text-sm font-normal text-hit-gray-500">({noProgram.size})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {Array.from(noProgram.values()).map((e) => (
                <EventCard key={e.id} event={e} viewMode="list" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {crossProgram.size > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowDownAZ className="h-4 w-4 text-hit-uni-400" />
              Rund ums Studium
              <span className="text-sm font-normal text-hit-gray-500">({crossProgram.size})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {Array.from(crossProgram.values()).map((e) => (
                <EventCard key={e.id} event={e} viewMode="list" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
