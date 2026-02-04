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
import type { ProgramRecommendation, ClusterRecommendation } from '@/types/navigator'

interface NavigatorRecommendationsProps {
  programs: ProgramRecommendation[]
  clusters?: ClusterRecommendation[]
  onProgramSelect?: (programId: string) => void
  onViewEvents?: (programId: string) => void
}

export function NavigatorRecommendations({
  programs,
  clusters,
  onProgramSelect,
  onViewEvents,
}: NavigatorRecommendationsProps) {
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set())

  const toggleExpand = (programId: string) => {
    const newExpanded = new Set(expandedPrograms)
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId)
    } else {
      newExpanded.add(programId)
    }
    setExpandedPrograms(newExpanded)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getInstitutionLabel = (institution: string) => {
    switch (institution) {
      case 'UNI':
        return 'Universität'
      case 'HOCHSCHULE':
        return 'Hochschule'
      case 'BOTH':
        return 'Uni & HS'
      default:
        return institution
    }
  }

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Noch keine Empfehlungen verfügbar. Erzähle mir mehr über deine Interessen!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Empfohlene Studiengänge
        </h3>
        <Badge variant="secondary">{programs.length} Treffer</Badge>
      </div>

      <div className="grid gap-3">
        {programs.map((rec, index) => {
          const isExpanded = expandedPrograms.has(rec.program.id)
          const hasEvents = rec.relatedEvents && rec.relatedEvents.length > 0

          return (
            <Card
              key={rec.program.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <CardTitle className="text-base">
                        {rec.program.name}
                      </CardTitle>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span>{getInstitutionLabel(rec.program.institution)}</span>
                      {rec.program.cluster && (
                        <>
                          <span>•</span>
                          <span>{rec.program.cluster.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`text-xl font-bold ${getScoreColor(rec.relevanceScore)}`}>
                      {Math.round(rec.relevanceScore)}%
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="flex flex-wrap gap-1 mb-2">
                  {rec.matchReasons.map((reason, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>

                {isExpanded && hasEvents && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Zugehörige Veranstaltungen ({rec.relatedEvents!.length})
                    </h4>
                    <div className="space-y-2">
                      {rec.relatedEvents!.slice(0, 3).map((event) => (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="block p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                        >
                          <div className="font-medium text-sm">{event.title}</div>
                          {event.timeStart && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.timeStart).toLocaleDateString('de-DE', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          )}
                        </Link>
                      ))}
                      
                      {rec.relatedEvents!.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => onViewEvents?.(rec.program.id)}
                        >
                          Alle {rec.relatedEvents!.length} Veranstaltungen anzeigen
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(rec.program.id)}
                    disabled={!hasEvents}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Weniger
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        {hasEvents
                          ? `${rec.relatedEvents!.length} Veranstaltungen`
                          : 'Keine Veranstaltungen'}
                      </>
                    )}
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onProgramSelect?.(rec.program.id)}
                  >
                    Details anzeigen
                    <ExternalLink className="w-3 h-3 ml-1" />
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
