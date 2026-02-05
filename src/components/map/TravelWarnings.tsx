'use client'

import { AlertTriangle, Clock, MapPin, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TravelTimeAnalysis, RouteWarning } from '@/types/routes'

interface TravelWarningsProps {
  analyses?: TravelTimeAnalysis[]
  warnings?: RouteWarning[]
  onEventClick?: (eventId: string) => void
  onFindAlternative?: (eventId: string) => void
  className?: string
}

export default function TravelWarnings({
  analyses = [],
  warnings = [],
  onEventClick,
  onFindAlternative,
  className = '',
}: TravelWarningsProps) {
  // Filter to only show issues
  const issues = analyses.filter((a) => a.status !== 'ok')

  if (issues.length === 0 && warnings.length === 0) {
    return (
      <Card className={`bg-green-50 border-green-200 ${className}`}>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-green-700">
            <Info className="h-5 w-5" />
            <span className="font-medium">Alle Übergänge haben ausreichend Zeit</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.round(seconds / 60)
    return `${mins} Min.`
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Reisezeit-Warnungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {issues.map((analysis, index) => (
          <div
            key={`${analysis.eventFromId}-${analysis.eventToId}`}
            className={`p-3 rounded-lg border ${
              analysis.status === 'insufficient'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={analysis.status === 'insufficient' ? 'destructive' : 'outline'}
                    className={
                      analysis.status === 'tight'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        : ''
                    }
                  >
                    {analysis.status === 'insufficient' ? 'Nicht genug Zeit' : 'Knappe Zeit'}
                  </Badge>
                </div>

                <div className="text-sm space-y-1">
                  <p>
                    <button
                      onClick={() => onEventClick?.(analysis.eventFromId)}
                      className="font-medium hover:underline text-left"
                    >
                      {analysis.eventFromTitle}
                    </button>
                    <span className="mx-1">→</span>
                    <button
                      onClick={() => onEventClick?.(analysis.eventToId)}
                      className="font-medium hover:underline text-left"
                    >
                      {analysis.eventToTitle}
                    </button>
                  </p>

                  <div className="flex flex-wrap gap-3 text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {formatDistance(analysis.distance)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Gehzeit: {formatTime(analysis.walkingTime)}
                    </span>
                    <span>Verfügbar: {formatTime(analysis.timeBetweenEvents)}</span>
                  </div>

                  {analysis.timeMargin < 0 && (
                    <p className="text-red-600 font-medium">
                      {formatTime(Math.abs(analysis.timeMargin))} zu wenig
                    </p>
                  )}
                </div>
              </div>

              {onFindAlternative && analysis.status === 'insufficient' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFindAlternative(analysis.eventToId)}
                  className="shrink-0"
                >
                  Alternative finden
                </Button>
              )}
            </div>
          </div>
        ))}

        {warnings.map((warning, index) => (
          <div
            key={`warning-${index}`}
            className={`p-3 rounded-lg border ${
              warning.severity === 'error'
                ? 'bg-red-50 border-red-200'
                : warning.severity === 'warning'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {warning.severity === 'error' ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : warning.severity === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <Info className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-sm">{warning.message}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
