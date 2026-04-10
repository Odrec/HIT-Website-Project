'use client'

import { Fragment, useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Building2, ChevronDown, ChevronRight, DoorOpen } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface Room {
  id: string
  name: string
  floor: string | null
  buildingId: string
  createdAt: string
  updatedAt: string
}

interface Building {
  id: string
  slug: string
  name: string
  shortName: string | null
  campus: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  hasAccessibility: boolean
  accessibilityNotes: string | null
  rooms: Room[]
  createdAt: string
  updatedAt: string
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set())

  // Building create/edit dialog
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null)
  const [savingBuilding, setSavingBuilding] = useState(false)
  const [buildingForm, setBuildingForm] = useState({
    name: '',
    shortName: '',
    slug: '',
    address: '',
    campus: '',
    latitude: '',
    longitude: '',
    hasAccessibility: false,
    accessibilityNotes: '',
  })

  // Building delete dialog
  const [deleteBuildingDialogOpen, setDeleteBuildingDialogOpen] = useState(false)
  const [buildingToDelete, setBuildingToDelete] = useState<Building | null>(null)
  const [deletingBuilding, setDeletingBuilding] = useState(false)

  // Room create/edit dialog
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [roomBuildingId, setRoomBuildingId] = useState<string | null>(null)
  const [savingRoom, setSavingRoom] = useState(false)
  const [roomForm, setRoomForm] = useState({
    name: '',
    floor: '',
  })

  // Room delete dialog
  const [deleteRoomDialogOpen, setDeleteRoomDialogOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)
  const [deletingRoom, setDeletingRoom] = useState(false)

  const fetchBuildings = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/buildings')
      if (response.ok) {
        const data = await response.json()
        setBuildings(data)
      }
    } catch (error) {
      console.error('Failed to fetch buildings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBuildings()
  }, [fetchBuildings])

  const toggleExpanded = (buildingId: string) => {
    setExpandedBuildings((prev) => {
      const next = new Set(prev)
      if (next.has(buildingId)) {
        next.delete(buildingId)
      } else {
        next.add(buildingId)
      }
      return next
    })
  }

  // --- Building handlers ---

  const openCreateBuildingDialog = () => {
    setEditingBuilding(null)
    setBuildingForm({
      name: '',
      shortName: '',
      slug: '',
      address: '',
      campus: '',
      latitude: '',
      longitude: '',
      hasAccessibility: false,
      accessibilityNotes: '',
    })
    setBuildingDialogOpen(true)
  }

  const openEditBuildingDialog = (building: Building) => {
    setEditingBuilding(building)
    setBuildingForm({
      name: building.name,
      shortName: building.shortName || '',
      slug: building.slug,
      address: building.address || '',
      campus: building.campus || '',
      latitude: building.latitude?.toString() || '',
      longitude: building.longitude?.toString() || '',
      hasAccessibility: building.hasAccessibility,
      accessibilityNotes: building.accessibilityNotes || '',
    })
    setBuildingDialogOpen(true)
  }

  const handleSaveBuilding = async () => {
    if (!buildingForm.name.trim()) return

    setSavingBuilding(true)
    try {
      const body = {
        name: buildingForm.name.trim(),
        shortName: buildingForm.shortName.trim() || null,
        slug: buildingForm.slug.trim() || undefined,
        address: buildingForm.address.trim() || null,
        campus: buildingForm.campus.trim() || null,
        latitude: buildingForm.latitude ? parseFloat(buildingForm.latitude) : null,
        longitude: buildingForm.longitude ? parseFloat(buildingForm.longitude) : null,
        hasAccessibility: buildingForm.hasAccessibility,
        accessibilityNotes: buildingForm.accessibilityNotes.trim() || null,
      }

      const url = editingBuilding ? `/api/buildings/${editingBuilding.id}` : '/api/buildings'
      const method = editingBuilding ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setBuildingDialogOpen(false)
        fetchBuildings()
      } else {
        const error = await response.json()
        alert(error.message || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Failed to save building:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSavingBuilding(false)
    }
  }

  const handleDeleteBuilding = async () => {
    if (!buildingToDelete) return

    setDeletingBuilding(true)
    try {
      const response = await fetch(`/api/buildings/${buildingToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteBuildingDialogOpen(false)
        setBuildingToDelete(null)
        fetchBuildings()
      } else {
        const error = await response.json()
        alert(error.message || 'Fehler beim Löschen')
      }
    } catch (error) {
      console.error('Failed to delete building:', error)
      alert('Fehler beim Löschen')
    } finally {
      setDeletingBuilding(false)
    }
  }

  // --- Room handlers ---

  const openAddRoomDialog = (buildingId: string) => {
    setEditingRoom(null)
    setRoomBuildingId(buildingId)
    setRoomForm({ name: '', floor: '' })
    setRoomDialogOpen(true)
  }

  const openEditRoomDialog = (room: Room) => {
    setEditingRoom(room)
    setRoomBuildingId(room.buildingId)
    setRoomForm({
      name: room.name,
      floor: room.floor || '',
    })
    setRoomDialogOpen(true)
  }

  const handleSaveRoom = async () => {
    if (!roomForm.name.trim()) return

    setSavingRoom(true)
    try {
      const body = {
        name: roomForm.name.trim(),
        floor: roomForm.floor.trim() || null,
      }

      const url = editingRoom
        ? `/api/rooms/${editingRoom.id}`
        : `/api/buildings/${roomBuildingId}/rooms`
      const method = editingRoom ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setRoomDialogOpen(false)
        fetchBuildings()
      } else {
        const error = await response.json()
        alert(error.message || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Failed to save room:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSavingRoom(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return

    setDeletingRoom(true)
    try {
      const response = await fetch(`/api/rooms/${roomToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteRoomDialogOpen(false)
        setRoomToDelete(null)
        fetchBuildings()
      } else {
        const error = await response.json()
        alert(error.message || 'Fehler beim Löschen')
      }
    } catch (error) {
      console.error('Failed to delete room:', error)
      alert('Fehler beim Löschen')
    } finally {
      setDeletingRoom(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gebäude</h1>
          <p className="text-muted-foreground">Verwalten Sie Gebäude und deren Räume</p>
        </div>
        <Button onClick={openCreateBuildingDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Gebäude hinzufügen
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : buildings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Noch keine Gebäude vorhanden
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: Table layout */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Gebäude ({buildings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Campus</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Räume</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buildings.map((building) => {
                      const isExpanded = expandedBuildings.has(building.id)
                      return (
                        <Fragment key={building.id}>
                          <TableRow>
                            <TableCell>
                              <button
                                onClick={() => toggleExpanded(building.id)}
                                className="p-1 hover:bg-muted rounded"
                                aria-label={isExpanded ? 'Einklappen' : 'Ausklappen'}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  {building.name}
                                  {building.shortName && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      ({building.shortName})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{building.campus || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {building.address || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{building.rooms?.length ?? 0}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditBuildingDialog(building)}
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Bearbeiten
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setBuildingToDelete(building)
                                    setDeleteBuildingDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Löschen
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${building.id}-rooms`}>
                              <TableCell colSpan={6} className="bg-muted/30 p-0">
                                <div className="px-8 py-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                      <DoorOpen className="h-4 w-4" />
                                      Räume
                                    </h4>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openAddRoomDialog(building.id)}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Raum hinzufügen
                                    </Button>
                                  </div>
                                  {!building.rooms || building.rooms.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-2">
                                      Noch keine Räume vorhanden
                                    </p>
                                  ) : (
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Name</TableHead>
                                          <TableHead>Etage</TableHead>
                                          <TableHead className="text-right">Aktionen</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {building.rooms.map((room) => (
                                          <TableRow key={room.id}>
                                            <TableCell className="font-medium">
                                              {room.name}
                                            </TableCell>
                                            <TableCell>{room.floor || '-'}</TableCell>
                                            <TableCell className="text-right">
                                              <div className="flex items-center justify-end gap-2">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => openEditRoomDialog(room)}
                                                >
                                                  <Pencil className="h-4 w-4 mr-1" />
                                                  Bearbeiten
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="text-destructive hover:text-destructive"
                                                  onClick={() => {
                                                    setRoomToDelete(room)
                                                    setDeleteRoomDialogOpen(true)
                                                  }}
                                                >
                                                  <Trash2 className="h-4 w-4 mr-1" />
                                                  Löschen
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile: Card layout */}
          <div className="space-y-4 md:hidden">
            {buildings.map((building) => {
              const isExpanded = expandedBuildings.has(building.id)
              return (
                <Card key={building.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                        <CardTitle className="text-base truncate">{building.name}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {building.rooms?.length ?? 0} Räume
                      </Badge>
                    </div>
                    {(building.campus || building.address) && (
                      <div className="text-sm text-muted-foreground space-y-0.5 mt-1 ml-7">
                        {building.campus && <p>{building.campus}</p>}
                        {building.address && <p className="truncate">{building.address}</p>}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Building actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditBuildingDialog(building)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Bearbeiten
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setBuildingToDelete(building)
                          setDeleteBuildingDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Löschen
                      </Button>
                    </div>

                    {/* Expand/collapse rooms */}
                    <button
                      className="w-full flex items-center justify-between text-sm font-medium py-1 hover:text-foreground text-muted-foreground"
                      onClick={() => toggleExpanded(building.id)}
                    >
                      <span className="flex items-center gap-1">
                        <DoorOpen className="h-4 w-4" />
                        Räume
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="space-y-2 border-t pt-3">
                        {!building.rooms || building.rooms.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Noch keine Räume vorhanden
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {building.rooms.map((room) => (
                              <div
                                key={room.id}
                                className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 gap-2"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{room.name}</p>
                                  {room.floor && (
                                    <p className="text-xs text-muted-foreground">
                                      Etage: {room.floor}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditRoomDialog(room)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => {
                                      setRoomToDelete(room)
                                      setDeleteRoomDialogOpen(true)
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => openAddRoomDialog(building.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Raum hinzufügen
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Building Create/Edit Dialog */}
      <Dialog open={buildingDialogOpen} onOpenChange={setBuildingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBuilding ? 'Gebäude bearbeiten' : 'Gebäude hinzufügen'}
            </DialogTitle>
            <DialogDescription>
              {editingBuilding
                ? 'Bearbeiten Sie die Details des Gebäudes'
                : 'Fügen Sie ein neues Gebäude hinzu'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building-name">Name *</Label>
                <Input
                  id="building-name"
                  value={buildingForm.name}
                  onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  placeholder="z.B. AVZ, Schloss Osnabrück"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="building-shortName">Kurzname</Label>
                <Input
                  id="building-shortName"
                  value={buildingForm.shortName}
                  onChange={(e) => setBuildingForm({ ...buildingForm, shortName: e.target.value })}
                  placeholder="z.B. AVZ, Schloss"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building-slug">Slug (URL-ID)</Label>
                <Input
                  id="building-slug"
                  value={buildingForm.slug}
                  onChange={(e) => setBuildingForm({ ...buildingForm, slug: e.target.value })}
                  placeholder="z.B. avz, schloss"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="building-campus">Campus</Label>
                <Input
                  id="building-campus"
                  value={buildingForm.campus}
                  onChange={(e) => setBuildingForm({ ...buildingForm, campus: e.target.value })}
                  placeholder="z.B. schloss, westerberg, caprivi"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="building-address">Adresse</Label>
              <Input
                id="building-address"
                value={buildingForm.address}
                onChange={(e) => setBuildingForm({ ...buildingForm, address: e.target.value })}
                placeholder="z.B. Albrechtstraße 28, 49076 Osnabrück"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building-latitude">Breitengrad</Label>
                <Input
                  id="building-latitude"
                  type="number"
                  step="any"
                  value={buildingForm.latitude}
                  onChange={(e) => setBuildingForm({ ...buildingForm, latitude: e.target.value })}
                  placeholder="52.2815"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="building-longitude">Längengrad</Label>
                <Input
                  id="building-longitude"
                  type="number"
                  step="any"
                  value={buildingForm.longitude}
                  onChange={(e) => setBuildingForm({ ...buildingForm, longitude: e.target.value })}
                  placeholder="8.0231"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="building-accessibility"
                checked={buildingForm.hasAccessibility}
                onCheckedChange={(checked) =>
                  setBuildingForm({ ...buildingForm, hasAccessibility: checked === true })
                }
              />
              <Label htmlFor="building-accessibility">Barrierefrei</Label>
            </div>
            {!buildingForm.hasAccessibility && (
              <div className="space-y-2">
                <Label htmlFor="building-accessibilityNotes">Barrierefreiheit Hinweise</Label>
                <Input
                  id="building-accessibilityNotes"
                  value={buildingForm.accessibilityNotes}
                  onChange={(e) =>
                    setBuildingForm({ ...buildingForm, accessibilityNotes: e.target.value })
                  }
                  placeholder="z.B. Historisches Gebäude, eingeschränkter Zugang"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuildingDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveBuilding}
              disabled={savingBuilding || !buildingForm.name.trim()}
            >
              {savingBuilding ? 'Speichern...' : editingBuilding ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Building Delete Dialog */}
      <Dialog open={deleteBuildingDialogOpen} onOpenChange={setDeleteBuildingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gebäude löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie das Gebäude &quot;{buildingToDelete?.name}&quot; löschen
              möchten? Alle zugehörigen Räume werden ebenfalls gelöscht. Diese Aktion kann nicht
              rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteBuildingDialogOpen(false)
                setBuildingToDelete(null)
              }}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBuilding}
              disabled={deletingBuilding}
            >
              {deletingBuilding ? 'Löschen...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Create/Edit Dialog */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Raum bearbeiten' : 'Raum hinzufügen'}</DialogTitle>
            <DialogDescription>
              {editingRoom
                ? 'Bearbeiten Sie die Details des Raumes'
                : 'Fügen Sie einen neuen Raum hinzu'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Name *</Label>
              <Input
                id="room-name"
                value={roomForm.name}
                onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                placeholder="z.B. 101, Hoersaal 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-floor">Etage</Label>
              <Input
                id="room-floor"
                value={roomForm.floor}
                onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                placeholder="z.B. 1. OG, Erdgeschoss"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveRoom} disabled={savingRoom || !roomForm.name.trim()}>
              {savingRoom ? 'Speichern...' : editingRoom ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Delete Dialog */}
      <Dialog open={deleteRoomDialogOpen} onOpenChange={setDeleteRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raum löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie den Raum &quot;{roomToDelete?.name}&quot; löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteRoomDialogOpen(false)
                setRoomToDelete(null)
              }}
            >
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDeleteRoom} disabled={deletingRoom}>
              {deletingRoom ? 'Löschen...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
