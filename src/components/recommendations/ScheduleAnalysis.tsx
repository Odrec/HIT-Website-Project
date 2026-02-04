'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Lightbulb,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { useSchedule } from '@/contexts/schedule-context'
import type { ScheduleOptimizationResult } from '@/types/recommendations'

interface ScheduleAnalysisProps {
  onOptimizationSelect?: (optimization: ScheduleOptimizationResult['optimizations'][0]) => void
}

export function ScheduleAnalysis({ onOptimizationSelect }: ScheduleAnalysisProps) {
  const { state } = useSchedule()
  const [analysis, setAnalysis] = useState<ScheduleOptimizationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scheduledEventIds = state.items.map(item => item.eventId)

  const analyzeSchedule = useCallback(async () => {
    if (scheduledEventIds.length === 0) {
      setAnalysis(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/recommendations/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledEventIds }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze schedule')
      }

      const data: ScheduleOptimizationResult = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [scheduledEventIds])

  useEffect(() => {
    analyzeSchedule()
  }, [analyzeSchedule])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (scheduledEventIds.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Füge Veranstaltungen zu deinem Zeitplan hinzu, um eine Analyse zu sehen.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
          <p className="text-gray-600">Analysiere deinen Zeitplan...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-600">Fehler bei der Analyse: {error}</p>
          <Button onClick={analyzeSchedule} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) return null

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Zeitplan-Bewertung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${getScoreColor(analysis.currentScore)}`}>
              {analysis.currentScore}
            </div>
            <div className="flex-1">
              <Progress 
                value={analysis.currentScore} 
                className="h-3"
              />
              <p className="text-sm text-gray-500 mt-1">
                {analysis.currentScore >= 80 && 'Ausgezeichneter Zeitplan!'}
                {analysis.currentScore >= 60 && analysis.currentScore < 80 && 'Guter Zeitplan mit Verbesserungspotenzial'}
                {analysis.currentScore >= 40 && analysis.currentScore < 60 && 'Zeitplan könnte optimiert werden'}
                {analysis.currentScore < 40 && 'Zeitplan benötigt Überarbeitung'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conflicts */}
      {analysis.conflicts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              Zeitkonflikte ({analysis.conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.conflicts.map((conflict, idx) => (
                <li key={idx} className="flex items-center text-sm text-yellow-800">
                  <Clock className="h-4 w-4 mr-2" />
                  {conflict.overlapMinutes} Min. Überschneidung
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* No Conflicts */}
      {analysis.conflicts.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="text-green-800">Keine Zeitkonflikte in deinem Zeitplan</span>
          </CardContent>
        </Card>
      )}

      {/* Gaps */}
      {analysis.gaps.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Freie Zeitfenster ({analysis.gaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.gaps.map((gap, idx) => (
                <li key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {new Date(gap.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(gap.end).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Badge variant="secondary">{gap.durationMinutes} Min.</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Diversity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Vielfalt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event Types */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Veranstaltungstypen</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(analysis.diversity.eventTypeDistribution).map(([type, count]) => (
                <Badge key={type} variant="outline">
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </div>

          {/* Locations */}
          {Object.keys(analysis.diversity.locationDistribution).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Standorte</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analysis.diversity.locationDistribution).map(([location, count]) => (
                  <Badge key={location} variant="outline">
                    {location}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimizations */}
      {analysis.optimizations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Optimierungsvorschläge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.optimizations.map((opt, idx) => (
                <li 
                  key={idx} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => onOptimizationSelect?.(opt)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{opt.description}</p>
                    <p className="text-sm text-gray-600">{opt.suggestedAction.reason}</p>
                  </div>
                  <Badge variant="secondary">+{opt.benefitScore}%</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ScheduleAnalysis
