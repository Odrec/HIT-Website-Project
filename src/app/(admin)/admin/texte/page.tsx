'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ContentSlot } from '@/lib/content-slots'

export default function AdminTextePage() {
  const [slots, setSlots] = useState<ContentSlot[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/content-texts')
      if (!res.ok) throw new Error('load failed')
      const body = await res.json()
      setSlots(body.slots)
      setValues(body.values)
    } catch {
      setError('Textbausteine konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const grouped = useMemo(() => {
    const out: Record<string, ContentSlot[]> = {}
    for (const s of slots) (out[s.group] ??= []).push(s)
    return out
  }, [slots])

  const save = async (slot: ContentSlot) => {
    setSavingKey(slot.key)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/content-texts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: slot.key, value: values[slot.key] ?? '' }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error || 'Speichern fehlgeschlagen')
      setMessage(`„${slot.label}" gespeichert.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSavingKey(null)
    }
  }

  const reset = async (slot: ContentSlot) => {
    setSavingKey(slot.key)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch(`/api/admin/content-texts?key=${encodeURIComponent(slot.key)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Zurücksetzen fehlgeschlagen')
      setValues((v) => ({ ...v, [slot.key]: slot.default }))
      setMessage(`„${slot.label}" auf den Standard zurückgesetzt.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zurücksetzen fehlgeschlagen')
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Textbausteine werden geladen...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hit-gray-900">Texte</h1>
        <p className="mt-1 text-sm text-gray-500">
          Texte der Startseite bearbeiten. Änderungen sind sofort öffentlich sichtbar.
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {Object.entries(grouped).map(([group, groupSlots]) => (
        <Card key={group}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupSlots.map((slot) => {
              const isDefault = (values[slot.key] ?? '') === slot.default
              return (
                <div key={slot.key} className="space-y-1.5">
                  <Label htmlFor={slot.key}>{slot.label}</Label>
                  {slot.multiline ? (
                    <Textarea
                      id={slot.key}
                      rows={3}
                      value={values[slot.key] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [slot.key]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      id={slot.key}
                      value={values[slot.key] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [slot.key]: e.target.value }))}
                    />
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="uni"
                      onClick={() => save(slot)}
                      disabled={savingKey === slot.key}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Speichern
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => reset(slot)}
                      disabled={savingKey === slot.key || isDefault}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Auf Standard zurücksetzen
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
