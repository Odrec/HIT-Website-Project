'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Edition = {
  id: string
  year: number
  hitDate: string
  submissionDeadline: string | null
  deadlineEnabled: boolean
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
}

export default function EditionsPage() {
  const { toast } = useToast()
  const [editions, setEditions] = useState<Edition[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Edition>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/editions')
      .then((r) => r.json())
      .then(setEditions)
      .catch(() => toast({ variant: 'destructive', title: 'Fehler beim Laden' }))
  }, [toast])

  const startEdit = (e: Edition) => {
    setEditingId(e.id)
    setDraft({
      hitDate: e.hitDate.slice(0, 10),
      submissionDeadline: e.submissionDeadline ? e.submissionDeadline.slice(0, 10) : null,
      deadlineEnabled: e.deadlineEnabled,
    })
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/editions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (!res.ok) throw new Error('save failed')
      const updated = await res.json()
      setEditions((prev) => prev.map((e) => (e.id === id ? updated : e)))
      setEditingId(null)
      toast({ title: 'Edition gespeichert' })
    } catch {
      toast({ variant: 'destructive', title: 'Fehler beim Speichern' })
    } finally {
      setSaving(false)
    }
  }

  const badgeVariant = (status: Edition['status']) =>
    status === 'ACTIVE' ? 'default' : status === 'DRAFT' ? 'secondary' : 'outline'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Editionen</h1>
        <p className="text-sm text-muted-foreground">
          Verwaltung der HIT-Jahrgänge. Rollover-Funktion wird in einer späteren Version ergänzt.
        </p>
      </div>

      {editions.map((e) => (
        <Card key={e.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>HIT {e.year}</CardTitle>
              <CardDescription>HIT-Datum: {new Date(e.hitDate).toLocaleDateString('de-DE')}</CardDescription>
            </div>
            <Badge variant={badgeVariant(e.status)}>{e.status}</Badge>
          </CardHeader>
          <CardContent>
            {editingId === e.id ? (
              <div className="space-y-4">
                <div>
                  <Label>HIT-Datum</Label>
                  <Input
                    type="date"
                    value={(draft.hitDate as string) ?? ''}
                    onChange={(ev) => setDraft({ ...draft, hitDate: ev.target.value })}
                  />
                </div>
                <div>
                  <Label>Einsendeschluss</Label>
                  <Input
                    type="date"
                    value={(draft.submissionDeadline as string) ?? ''}
                    onChange={(ev) =>
                      setDraft({ ...draft, submissionDeadline: ev.target.value || null })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={draft.deadlineEnabled ?? true}
                    onCheckedChange={(v) => setDraft({ ...draft, deadlineEnabled: !!v })}
                  />
                  <Label>Einsendeschluss aktiv</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveEdit(e.id)} disabled={saving}>
                    Speichern
                  </Button>
                  <Button variant="outline" onClick={() => setEditingId(null)}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Einsendeschluss:</strong>{' '}
                  {e.submissionDeadline
                    ? new Date(e.submissionDeadline).toLocaleDateString('de-DE')
                    : '—'}
                  {!e.deadlineEnabled && ' (deaktiviert)'}
                </div>
                {e.status !== 'ARCHIVED' && (
                  <Button className="mt-2" size="sm" onClick={() => startEdit(e)}>
                    Bearbeiten
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}