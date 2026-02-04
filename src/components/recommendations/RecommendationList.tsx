'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Filter, Sparkles, TrendingUp } from 'lucide-react'
import { RecommendationCard } from './RecommendationCard'
import { useSchedule } from '@/contexts/schedule-context'
import type { RecommendationResult, EventRecommendation, RecommendationGroup } from '@/types/recommendations'

interface RecommendationListProps {
  studyProgramIds?: string[]
  institution?: 'UNI' | 'HOCHSCHULE' | 'BOTH'
  preferredEventTypes?: string[]
  showFilters?: boolean
  showGroups?: boolean
  limit?: number
  onEventSelect?: (eventId: string) => void
}

export function RecommendationList({
  studyProgramIds = [],
  institution,
  preferredEventTypes = [],
  showFilters = true,
  showGroups = true,
  limit = 20,
  onEventSelect,
}: RecommendationListProps) {
  const router = useRouter()
  const { state } = useSchedule()
  const [recommendations, setRecommendations] = useState<EventRecommendation[]>([])
  const [groups, setGroups] = useState<RecommendationGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [excludeConflicts, setExcludeConflicts] = useState(false)
  const [onlyHighDemand, setOnlyHighDemand] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Fetch recommendations on mount and when filters change
  useEffect(() => {

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    const fetchRecommendations = async () => {
      setLoading(true)
      setError(null)

      try {
        const scheduledEventIds = state.items.map(item => item.eventId)
        
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledEventIds,
            studyProgramIds,
            institution,
            preferredEventTypes,
            dismissedEventIds: dismissedIds,
            excludeConflicts,
            onlyHighDemand,
            limit,
          }),
          signal: abortControllerRef.current?.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to fetch recommendations')
        }

        const data: RecommendationResult = await response.json()
        setRecommendations(data.recommendations)
        setGroups(data.groups)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return // Ignore abort errors
        }
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  // Only re-fetch when filters or refreshTrigger changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludeConflicts, onlyHighDemand, refreshTrigger])

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleViewDetails = (eventId: string) => {
    if (onEventSelect) {
      onEventSelect(eventId)
    } else {
      router.push(`/events/${eventId}`)
    }
  }

  const handleDismiss = (eventId: string) => {
    setDismissedIds(prev => [...prev, eventId])
    setRecommendations(prev => prev.filter(rec => rec.event.id !== eventId))
  }

  const filteredRecommendations = selectedGroup
    ? recommendations.filter(rec => {
        const group = groups.find(g => g.category === selectedGroup)
        if (!group) return false
        return group.recommendations.some(r => r.event.id === rec.event.id)
      })
    : recommendations

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3 mb-3" />
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-600">Fehler beim Laden der Empfehlungen: {error}</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">Empfohlene Veranstaltungen</h2>
          <Badge variant="secondary">{recommendations.length} Empfehlungen</Badge>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={excludeConflicts ? 'default' : 'outline'}
            size="sm"
            onClick={() => setExcludeConflicts(!excludeConflicts)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Ohne Konflikte
          </Button>
          <Button
            variant={onlyHighDemand ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOnlyHighDemand(!onlyHighDemand)}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Nur beliebte
          </Button>
          {dismissedIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDismissedIds([])
                handleRefresh()
              }}
            >
              {dismissedIds.length} ausgeblendet zurücksetzen
            </Button>
          )}
        </div>
      )}

      {/* Groups */}
      {showGroups && groups.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600">Nach Kategorie filtern</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedGroup === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedGroup(null)}
            >
              Alle
            </Button>
            {groups.slice(0, 6).map((group) => (
              <Button
                key={group.category}
                variant={selectedGroup === group.category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedGroup(group.category)}
              >
                {group.category}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {group.recommendations.length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      {filteredRecommendations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Keine passenden Empfehlungen gefunden.</p>
            {dismissedIds.length > 0 && (
              <p className="text-sm mt-2">
                {dismissedIds.length} Empfehlungen wurden ausgeblendet.
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setDismissedIds([])
                    handleRefresh()
                  }}
                  className="ml-1"
                >
                  Zurücksetzen
                </Button>
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.event.id}
              recommendation={recommendation}
              onViewDetails={handleViewDetails}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default RecommendationList
