'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, TrendingUp, AlertTriangle, CheckCircle, Plus, Star } from 'lucide-react'
import { useSchedule } from '@/contexts/schedule-context'
import type { EventRecommendation } from '@/types/recommendations'

interface RecommendationCardProps {
  recommendation: EventRecommendation
  onViewDetails?: (eventId: string) => void
  onDismiss?: (eventId: string) => void
}

export function RecommendationCard({
  recommendation,
  onViewDetails,
  onDismiss,
}: RecommendationCardProps) {
  const { addEvent, isInSchedule } = useSchedule()
  const { event, score, reasons, conflictsWithSchedule, isHighDemand, travelTimeFromPrevious } =
    recommendation
  const isScheduled = isInSchedule(event.id)

  const handleAddToSchedule = () => {
    addEvent(event)
  }

  const formatTime = (date: Date | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
  }

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600 bg-green-100'
    if (s >= 60) return 'text-blue-600 bg-blue-100'
    if (s >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const eventTypeLabels: Record<string, string> = {
    VORTRAG: 'Vortrag',
    LABORFUEHRUNG: 'Laborführung',
    RUNDGANG: 'Rundgang',
    WORKSHOP: 'Workshop',
    LINK: 'Online-Link',
    INFOSTAND: 'Infostand',
  }

  return (
    <Card className={`relative ${conflictsWithSchedule ? 'border-yellow-400 bg-yellow-50' : ''}`}>
      {/* Score Badge */}
      <div
        className={`absolute top-3 right-3 px-2 py-1 rounded-full text-sm font-semibold ${getScoreColor(score)}`}
      >
        {score}% Match
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          {isHighDemand && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              <TrendingUp className="h-3 w-3 mr-1" />
              Beliebt
            </Badge>
          )}
          {conflictsWithSchedule && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Überschneidung
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg pr-16">{event.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Event Type */}
        <Badge variant="outline">{eventTypeLabels[event.eventType] || event.eventType}</Badge>

        {/* Time and Date */}
        {event.timeStart && (
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {formatDate(event.timeStart)}, {formatTime(event.timeStart)}
            {event.timeEnd && ` - ${formatTime(event.timeEnd)}`}
          </div>
        )}

        {/* Location */}
        {event.location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            {event.location.buildingName}
            {event.location.roomNumber && `, ${event.location.roomNumber}`}
          </div>
        )}

        {/* Travel Time */}
        {travelTimeFromPrevious !== undefined && travelTimeFromPrevious > 0 && (
          <div className="text-sm text-blue-600">
            🚶 {travelTimeFromPrevious} Min. Fußweg vom vorherigen Event
          </div>
        )}

        {/* Match Reasons */}
        <div className="space-y-1">
          {reasons.slice(0, 3).map((reason, idx) => (
            <div key={idx} className="flex items-center text-sm text-green-700">
              <Star className="h-3 w-3 mr-2 text-green-500" />
              {reason.description}
            </div>
          ))}
        </div>

        {/* Study Programs */}
        {event.studyPrograms && event.studyPrograms.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.studyPrograms.slice(0, 3).map((program) => (
              <Badge key={program.id} variant="secondary" className="text-xs">
                {program.name}
              </Badge>
            ))}
            {event.studyPrograms.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{event.studyPrograms.length - 3} weitere
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {isScheduled ? (
            <Button variant="outline" size="sm" disabled className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Im Zeitplan
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleAddToSchedule}
              className="flex-1"
              disabled={conflictsWithSchedule}
            >
              <Plus className="h-4 w-4 mr-2" />
              Hinzufügen
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onViewDetails?.(event.id)}>
            Details
          </Button>
          {onDismiss && !isScheduled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(event.id)}
              className="text-gray-500"
            >
              ✕
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default RecommendationCard
