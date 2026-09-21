'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star,
} from 'lucide-react'
import { AddToScheduleButton } from '@/components/schedule/AddToScheduleButton'
import { formatEventDateShort, formatEventTime } from '@/lib/event-time'
import type { NavigatorRecommendation } from '@/types/navigator'
import type { Event } from '@/types/events'

interface NavigatorRecommendationsProps {
  recommendation: NavigatorRecommendation
  onProgramSelect?: (programId: string) => void
  onViewEvents?: (programId: string) => void
}

const INSTITUTION_LABEL: Record<string, string> = {
  UNI: 'Universität Osnabrück',
  HOCHSCHULE: 'Hochschule Osnabrück',
  BOTH: 'Hochschulübergreifend',
}

function isLehramtName(name: string): boolean {
  return /lehramt/i.test(name)
}

export function NavigatorRecommendations({
  recommendation,
  onProgramSelect,
  onViewEvents,
}: NavigatorRecommendationsProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const { programs, summary } = recommendation

  const toggleExpand = (programId: string) => {
    const next = new Set(expanded)
    if (next.has(programId)) next.delete(programId)
    else next.add(programId)
    setExpanded(next)
  }

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            Noch keine Empfehlungen. Beantworte die Fragen im Chat!
          </p>
        </CardContent>
      </Card>
    )
  }

  const hasLehramt = programs.some((p) => isLehramtName(p.program.name)) || /lehramt/i.test(summary)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Star className="h-5 w-5 text-yellow-500" />
          Empfohlene Studiengänge
        </h3>
        <Badge variant="secondary">{programs.length} Vorschläge</Badge>
      </div>

      {summary && <p className="text-sm text-muted-foreground">{summary}</p>}

      {hasLehramt && (
        <p className="text-sm">
          Für Lehramt gelten Kombinationsregeln –{' '}
          <Link href="/events/lehramt" className="underline">
            alle Infos auf der Lehramt-Seite
          </Link>
          .
        </p>
      )}

      <div className="grid gap-3">
        {programs.map((rec, index) => {
          const isExpanded = expanded.has(rec.program.id)
          const events = rec.relatedEvents ?? []
          const hasEvents = events.length > 0

          return (
            <Card
              key={rec.program.id}
              className="overflow-hidden transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-muted-foreground">#{index + 1}</span>
                  <CardTitle className="text-base">{rec.program.name}</CardTitle>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>
                    {INSTITUTION_LABEL[rec.program.institution] ?? rec.program.institution}
                  </span>
                  {rec.program.clusters && rec.program.clusters.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{rec.program.clusters.map((c) => c.name).join(', ')}</span>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                {rec.reason && <p className="mb-2 text-sm">{rec.reason}</p>}

                {isExpanded && hasEvents && (
                  <div className="mt-3 border-t pt-3">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      Veranstaltungen am HIT ({events.length})
                    </h4>
                    <div className="space-y-2">
                      {events.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-2 rounded-md bg-muted p-2"
                        >
                          <Link href={`/events/${event.id}`} className="flex-1 hover:underline">
                            <div className="text-sm font-medium">{event.title}</div>
                            {event.timeStart && (
                              <div className="text-xs text-muted-foreground">
                                {formatEventDateShort(event.timeStart)},{' '}
                                {formatEventTime(event.timeStart)}
                              </div>
                            )}
                          </Link>
                          <AddToScheduleButton event={event as Event} size="sm" variant="ghost" />
                        </div>
                      ))}
                      {events.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => onViewEvents?.(rec.program.id)}
                        >
                          Alle {events.length} Veranstaltungen anzeigen
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between border-t pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(rec.program.id)}
                    disabled={!hasEvents}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="mr-1 h-4 w-4" />
                        Weniger
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-1 h-4 w-4" />
                        {hasEvents ? `${events.length} Veranstaltungen` : 'Keine Veranstaltungen'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onProgramSelect?.(rec.program.id)}
                  >
                    Details anzeigen
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default NavigatorRecommendations
