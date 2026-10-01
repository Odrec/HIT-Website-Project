'use client'

import { useCallback, useEffect, useState } from 'react'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CoordinateInputs } from '@/components/admin/CoordinateInputs'
import { validateCoordinatePair } from '@/lib/coordinates'
import type { ShuttleStop } from '@/types/shuttle'

const EMPTY_FORM = { name: '', latitude: '', longitude: '', directionsNote: '' }

/** Admin list + editor for the shuttle-bus stops drawn on the Lageplan. */
export function ShuttleStopsCard() {
  const [stops, setStops] = useState<ShuttleStop[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ShuttleStop | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchStops = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/shuttle-stops')
      if (res.ok) setStops(await res.json())
    } catch (error) {
      console.error('Failed to fetch shuttle stops:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStops()
  }, [fetchStops])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (stop: ShuttleStop) => {
    setEditing(stop)
    setForm({
      name: stop.name,
      latitude: String(stop.coordinates.latitude),
      longitude: String(stop.coordinates.longitude),
      directionsNote: stop.directionsNote ?? '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const coordinates = validateCoordinatePair(form.latitude, form.longitude, { required: true })
    if ('error' in coordinates) {
      alert(coordinates.error)
      return
    }

    setSaving(true)
    try {
      const res = await fetch(
        editing ? `/api/admin/shuttle-stops/${editing.id}` : '/api/admin/shuttle-stops',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            directionsNote: form.directionsNote.trim(),
          }),
        }
      )
      if (res.ok) {
        setDialogOpen(false)
        await fetchStops()
      } else {
        const error = await res.json().catch(() => ({}))
        alert(error.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Failed to save shuttle stop:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (stop: ShuttleStop) => {
    if (!confirm(`Haltestelle „${stop.name}" wirklich löschen?`)) return
    const res = await fetch(`/api/admin/shuttle-stops/${stop.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      alert(error.error || 'Fehler beim Löschen')
    }
    await fetchStops()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Haltestellen</CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Haltestelle hinzufügen
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-hit-gray-500">
          Diese Haltestellen erscheinen mit dem Bus-Symbol auf dem Lageplan im Routenplaner.
        </p>
        {loading ? (
          <p className="text-sm text-hit-gray-500">Laden...</p>
        ) : stops.length === 0 ? (
          <p className="text-sm text-hit-gray-500">Noch keine Haltestellen angelegt.</p>
        ) : (
          <ul className="divide-y">
            {stops.map((stop) => (
              <li
                key={stop.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-hit-uni-600" />
                  <div className="min-w-0">
                    <p className="font-medium">{stop.name}</p>
                    <p className="text-sm text-hit-gray-500 break-all">
                      {stop.coordinates.latitude}, {stop.coordinates.longitude}
                    </p>
                    {stop.directionsNote && (
                      <p className="text-sm text-hit-gray-500">{stop.directionsNote}</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(stop)}
                    aria-label={`${stop.name} bearbeiten`}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(stop)}
                    aria-label={`${stop.name} löschen`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Löschen
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Haltestelle bearbeiten' : 'Neue Haltestelle'}</DialogTitle>
            <DialogDescription>
              Position und Hinweis, wie Besucher*innen die Haltestelle finden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="stop-name">Name *</Label>
              <Input
                id="stop-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="z.B. Neuer Graben / Schloss"
              />
            </div>
            <CoordinateInputs
              idPrefix="stop"
              value={{ latitude: form.latitude, longitude: form.longitude }}
              onChange={(coords) => setForm({ ...form, ...coords })}
            />
            <div className="space-y-2">
              <Label htmlFor="stop-note">Hinweis</Label>
              <Input
                id="stop-note"
                value={form.directionsNote}
                onChange={(e) => setForm({ ...form, directionsNote: e.target.value })}
                placeholder="z.B. Zwei Haltestellen (eine pro Fahrtrichtung)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Speichern...' : editing ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
