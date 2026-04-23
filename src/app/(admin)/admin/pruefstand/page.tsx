'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertTriangle, Pencil, Check, Trash2 } from 'lucide-react'
import { formatEventTimeRange } from '@/lib/event-time'
import type { EventReviewStatus } from '@/types/events'

interface PruefstandEvent {
  id: string
  title: string
  reviewStatus: EventReviewStatus
  timeStart: string | null
  timeEnd: string | null
  sourceEventId: string | null
  sourceEvent: {
    id: string
    title: string
    edition: { year: number }
  } | null
  melder: { firstName: string; lastName: string } | null
  building: { name: string } | null
  room: { name: string } | null
}

const statusLabel = (s: EventReviewStatus) =>
  s === 'DRAFT_FROM_ROLLOVER'
    ? 'Entwurf (Rollover)'
    : s === 'NEEDS_REVIEW'
      ? 'Prüfung nötig'
      : 'Veröffentlicht'

const statusVariant = (s: EventReviewStatus): 'secondary' | 'default' | 'outline' =>
  s === 'DRAFT_FROM_ROLLOVER' ? 'secondary' : s === 'NEEDS_REVIEW' ? 'default' : 'outline'

export default function PruefstandPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<PruefstandEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'DRAFT_FROM_ROLLOVER' | 'NEEDS_REVIEW'>('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const notifyBadge = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pruefstand:refresh'))
    }
  }

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'ALL') params.set('reviewStatus', filter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/events/pruefstand?${params.toString()}`)
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setEvents(data)
    } catch {
      toast({ variant: 'destructive', title: 'Fehler beim Laden des Prüfstands' })
    } finally {
      setLoading(false)
    }
  }, [filter, search, toast])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handlePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}/publish`, { method: 'POST' })
      if (!res.ok) throw new Error('publish failed')
      toast({ title: 'Veröffentlicht' })
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      notifyBadge()
      fetchEvents()
    } catch {
      toast({ variant: 'destructive', title: 'Veröffentlichen fehlgeschlagen' })
    }
  }

  const handleDiscard = async (id: string) => {
    if (!confirm('Diesen Entwurf wirklich verwerfen? Die Quellveranstaltung bleibt unberührt.'))
      return
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      toast({ title: 'Verworfen' })
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      notifyBadge()
      fetchEvents()
    } catch {
      toast({ variant: 'destructive', title: 'Verwerfen fehlgeschlagen' })
    }
  }

  const handleBulkPublish = async () => {
    if (selected.size === 0) return
    const ids = [...selected]
    const results = await Promise.allSettled(
      ids.map((id) => fetch(`/api/events/${id}/publish`, { method: 'POST' }))
    )
    const failed = results.filter(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok)
    )
    if (failed.length === 0) {
      toast({ title: `${ids.length} Veranstaltungen veröffentlicht` })
    } else {
      toast({
        variant: 'destructive',
        title: `${ids.length - failed.length} veröffentlicht, ${failed.length} fehlgeschlagen`,
      })
    }
    setSelected(new Set())
    notifyBadge()
    fetchEvents()
  }

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = events.length > 0 && events.every((e) => selected.has(e.id))
  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(events.map((e) => e.id)))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prüfstand</CardTitle>
          <CardDescription>
            Aus der letzten Edition übernommene Entwürfe. Bearbeiten, veröffentlichen oder
            verwerfen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px]">
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Alle</SelectItem>
                  <SelectItem value="DRAFT_FROM_ROLLOVER">Entwurf (Rollover)</SelectItem>
                  <SelectItem value="NEEDS_REVIEW">Prüfung nötig</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Titel suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="default" disabled={selected.size === 0} onClick={handleBulkPublish}>
              {selected.size > 0 ? `${selected.size} veröffentlichen` : 'Markierte veröffentlichen'}
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-sm">Lädt…</p>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground text-sm">Keine Einträge im Prüfstand.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Alle auswählen"
                    />
                  </TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Melder</TableHead>
                  <TableHead>Herkunft</TableHead>
                  <TableHead>Zeit</TableHead>
                  <TableHead>Raum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(e.id)}
                        onCheckedChange={() => toggleSelected(e.id)}
                        aria-label={`${e.title} auswählen`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{e.title}</TableCell>
                    <TableCell>
                      {e.melder ? `${e.melder.firstName} ${e.melder.lastName}` : '—'}
                    </TableCell>
                    <TableCell>
                      {e.sourceEvent ? (
                        <span className="text-muted-foreground">
                          HIT {e.sourceEvent.edition.year} · {e.sourceEvent.title}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {e.timeStart && e.timeEnd ? (
                        formatEventTimeRange(new Date(e.timeStart), new Date(e.timeEnd))
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-3 w-3" /> fehlt
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {e.room ? (
                        `${e.building?.name ?? ''} ${e.room.name}`.trim()
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-3 w-3" /> fehlt
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(e.reviewStatus)}>
                        {statusLabel(e.reviewStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          asChild
                          title="Bearbeiten"
                          aria-label="Bearbeiten"
                        >
                          <Link href={`/admin/events/${e.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handlePublish(e.id)}
                          title="Veröffentlichen"
                          aria-label="Veröffentlichen"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDiscard(e.id)}
                          title="Verwerfen"
                          aria-label="Verwerfen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
