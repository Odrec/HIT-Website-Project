'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Plus, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { useSchedule } from '@/contexts/schedule-context'
import type { EventRecommendation, BatchAddResult } from '@/types/recommendations'

interface BatchAddButtonProps {
  recommendations: EventRecommendation[]
  onComplete?: (result: BatchAddResult) => void
}

export function BatchAddButton({ recommendations, onComplete }: BatchAddButtonProps) {
  const { state, addEvent, isInSchedule } = useSchedule()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [skipConflicts, setSkipConflicts] = useState(true)
  const [result, setResult] = useState<BatchAddResult | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const scheduledEventIds = state.items.map((item) => item.eventId)

  // Filter recommendations that aren't already in schedule
  const availableRecommendations = recommendations.filter((rec) => !isInSchedule(rec.event.id))

  const handleOpen = () => {
    setSelectedIds(availableRecommendations.map((r) => r.event.id))
    setResult(null)
    setOpen(true)
  }

  const toggleSelection = (eventId: string) => {
    setSelectedIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    )
  }

  const handleBatchAdd = async () => {
    if (selectedIds.length === 0) return

    setLoading(true)

    try {
      const response = await fetch('/api/recommendations/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventIds: selectedIds,
          scheduledEventIds,
          skipConflicts,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to batch add events')
      }

      const batchResult: BatchAddResult = await response.json()
      setResult(batchResult)

      // Add events to local schedule
      const eventsToAdd = recommendations.filter((rec) =>
        batchResult.addedEventIds.includes(rec.event.id)
      )

      eventsToAdd.forEach((rec) => {
        addEvent(rec.event)
      })

      onComplete?.(batchResult)
    } catch (error) {
      console.error('Batch add error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (availableRecommendations.length === 0) {
    return null
  }

  const conflictCount = availableRecommendations.filter((r) => r.conflictsWithSchedule).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={handleOpen}>
          <Plus className="h-4 w-4 mr-2" />
          Alle hinzufügen ({availableRecommendations.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mehrere Veranstaltungen hinzufügen</DialogTitle>
          <DialogDescription>
            Wähle die Veranstaltungen aus, die du zu deinem Zeitplan hinzufügen möchtest.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            {/* Conflict Warning */}
            {conflictCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">
                  {conflictCount} Veranstaltung{conflictCount > 1 ? 'en' : ''} mit
                  Zeitüberschneidungen
                </span>
              </div>
            )}

            {/* Options */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipConflicts"
                checked={skipConflicts}
                onCheckedChange={(checked) => setSkipConflicts(checked === true)}
              />
              <Label htmlFor="skipConflicts" className="text-sm">
                Überschneidungen automatisch überspringen
              </Label>
            </div>

            {/* Event List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableRecommendations.map((rec) => (
                <div
                  key={rec.event.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedIds.includes(rec.event.id)
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  } ${rec.conflictsWithSchedule ? 'opacity-70' : ''}`}
                  onClick={() => toggleSelection(rec.event.id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(rec.event.id)}
                    onCheckedChange={() => toggleSelection(rec.event.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{rec.event.title}</p>
                    <p className="text-xs text-gray-500">
                      {rec.event.timeStart &&
                        new Date(rec.event.timeStart).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {rec.score}%
                    </Badge>
                    {rec.conflictsWithSchedule && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleBatchAdd} disabled={loading || selectedIds.length === 0}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird hinzugefügt...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {selectedIds.length} hinzufügen
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* Result View */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  {result.addedCount} Veranstaltung{result.addedCount !== 1 ? 'en' : ''} hinzugefügt
                </p>
                {result.skippedCount > 0 && (
                  <p className="text-sm text-green-700">
                    {result.skippedCount} übersprungen (Konflikte)
                  </p>
                )}
              </div>
            </div>

            {result.conflictingEventIds.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  {result.conflictCount} Veranstaltung{result.conflictCount !== 1 ? 'en' : ''}{' '}
                  hatten Zeitkonflikte
                </p>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Schließen</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default BatchAddButton
