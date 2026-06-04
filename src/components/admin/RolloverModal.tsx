'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface Props {
  currentActiveYear: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RolloverModal({ currentActiveYear, open, onOpenChange }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [year, setYear] = useState(String(currentActiveYear + 1))
  const [hitDate, setHitDate] = useState('')
  const [submissionDeadline, setSubmissionDeadline] = useState('')
  const [cloneEvents, setCloneEvents] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/editions/rollover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: Number(year),
          hitDate,
          submissionDeadline: submissionDeadline || null,
          cloneEvents,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Rollover fehlgeschlagen' }))
        throw new Error(err.error ?? 'Rollover fehlgeschlagen')
      }
      const body = await res.json()
      toast({
        title: `HIT ${body.edition.year} erstellt`,
        description: body.clonedCount
          ? `${body.clonedCount} Veranstaltungen in den Prüfstand übernommen.`
          : 'Keine Veranstaltungen übernommen.',
      })
      onOpenChange(false)
      // Navigate to events list; ?includeReview=1 surfaces the freshly-cloned
      // Prüfstand entries on the admin events page (Fix B in PR B Chunk 3).
      router.push('/admin/events?includeReview=1')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Rollover fehlgeschlagen'
      toast({ variant: 'destructive', title: 'Fehler', description: message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Edition starten</DialogTitle>
          <DialogDescription>
            Archiviert die aktuelle Edition (HIT {currentActiveYear}) und legt eine neue aktive
            Edition an. Veranstaltungen können als Entwurf übernommen werden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Jahr</Label>
            <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            <p className="mt-1 text-xs text-muted-foreground">
              Muss eindeutig sein. Für eine Testübernahme darf auch eine andere (z. B. niedrigere)
              Jahreszahl verwendet werden.
            </p>
          </div>
          <div>
            <Label>HIT-Datum</Label>
            <Input type="date" value={hitDate} onChange={(e) => setHitDate(e.target.value)} />
          </div>
          <div>
            <Label>Einsendeschluss (optional)</Label>
            <Input
              type="date"
              value={submissionDeadline}
              onChange={(e) => setSubmissionDeadline(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={cloneEvents}
              onCheckedChange={(v) => setCloneEvents(!!v)}
              id="cloneEvents"
            />
            <Label htmlFor="cloneEvents">
              Alle Veranstaltungen aus HIT {currentActiveYear} übernehmen
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !hitDate || !year}>
            {submitting ? 'Wird erstellt…' : 'Edition erstellen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
