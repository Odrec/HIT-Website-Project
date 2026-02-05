'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, MapPin, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Location {
  id: string
  buildingName: string
  roomNumber: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  createdAt: string
  updatedAt: string
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    buildingName: '',
    roomNumber: '',
    address: '',
    latitude: '',
    longitude: '',
  })

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const filteredLocations = locations.filter((loc) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      loc.buildingName.toLowerCase().includes(searchLower) ||
      (loc.roomNumber && loc.roomNumber.toLowerCase().includes(searchLower)) ||
      (loc.address && loc.address.toLowerCase().includes(searchLower))
    )
  })

  const openCreateDialog = () => {
    setEditingLocation(null)
    setFormData({
      buildingName: '',
      roomNumber: '',
      address: '',
      latitude: '',
      longitude: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      buildingName: location.buildingName,
      roomNumber: location.roomNumber || '',
      address: location.address || '',
      latitude: location.latitude?.toString() || '',
      longitude: location.longitude?.toString() || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.buildingName.trim()) return

    setSaving(true)
    try {
      const body = {
        buildingName: formData.buildingName.trim(),
        roomNumber: formData.roomNumber.trim() || null,
        address: formData.address.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      }

      const url = editingLocation ? `/api/locations/${editingLocation.id}` : '/api/locations'
      const method = editingLocation ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setDialogOpen(false)
        fetchLocations()
      } else {
        const error = await response.json()
        alert(error.message || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Failed to save location:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!locationToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/locations/${locationToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        setLocationToDelete(null)
        fetchLocations()
      } else {
        const error = await response.json()
        alert(error.message || 'Fehler beim Löschen')
      }
    } catch (error) {
      console.error('Failed to delete location:', error)
      alert('Fehler beim Löschen')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orte</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Gebäude und Räume für Veranstaltungen
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Ort
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Suche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Nach Gebäude, Raum oder Adresse suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5" />
            Orte ({filteredLocations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? 'Keine Orte gefunden' : 'Noch keine Orte vorhanden'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gebäude</TableHead>
                  <TableHead>Raum</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Koordinaten</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {location.buildingName}
                      </div>
                    </TableCell>
                    <TableCell>{location.roomNumber || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {location.address || '-'}
                    </TableCell>
                    <TableCell>
                      {location.latitude && location.longitude ? (
                        <span className="text-xs text-muted-foreground">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(location)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setLocationToDelete(location)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Ort bearbeiten' : 'Neuer Ort'}</DialogTitle>
            <DialogDescription>
              {editingLocation
                ? 'Bearbeiten Sie die Details des Ortes'
                : 'Fügen Sie einen neuen Ort hinzu'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="buildingName">Gebäude *</Label>
              <Input
                id="buildingName"
                value={formData.buildingName}
                onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                placeholder="z.B. AVZ, Schloss, Gebäude A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Raum</Label>
              <Input
                id="roomNumber"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="z.B. 101, Hörsaal 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="z.B. Barbarastraße 22"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Breitengrad</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="52.2815"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Längengrad</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="8.0231"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.buildingName.trim()}>
              {saving ? 'Speichern...' : editingLocation ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ort löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie den Ort &quot;{locationToDelete?.buildingName}
              {locationToDelete?.roomNumber ? ` - ${locationToDelete.roomNumber}` : ''}
              &quot; löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setLocationToDelete(null)
              }}
            >
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Löschen...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
