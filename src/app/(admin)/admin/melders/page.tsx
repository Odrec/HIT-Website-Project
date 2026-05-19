'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Affiliation } from '@/types/events'
import { affiliationLabels, MelderFormData } from '@/lib/validations/melder'

interface MelderUser {
  id: string
  email: string | null
  name: string | null
  role: string
}

interface Melder {
  id: string
  firstName: string
  lastName: string
  title: string | null
  email: string
  phone: string | null
  affiliation: Affiliation
  fakultaet: string | null
  fachbereich: string | null
  room: string | null
  createdAt: string
  updatedAt: string
  user: MelderUser
  _count: { events: number }
}

const affiliationVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  UNI: 'default',
  HOCHSCHULE: 'secondary',
  BEIDE: 'secondary',
  EXTERN: 'outline',
}

const emptyFormData: MelderFormData = {
  firstName: '',
  lastName: '',
  title: '',
  email: '',
  phone: '',
  affiliation: 'UNI',
  fakultaet: '',
  fachbereich: '',
  room: '',
}

export default function MeldersPage() {
  const [melders, setMelders] = useState<Melder[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMelder, setEditingMelder] = useState<Melder | null>(null)
  const [formData, setFormData] = useState<MelderFormData>(emptyFormData)
  const [saving, setSaving] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [melderToDelete, setMelderToDelete] = useState<Melder | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchMelders = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/melder/all')
      if (response.ok) {
        const data = await response.json()
        setMelders(data)
      }
    } catch (error) {
      console.error('Failed to fetch melders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMelders()
  }, [fetchMelders])

  const openCreateDialog = () => {
    setEditingMelder(null)
    setFormData(emptyFormData)
    setDialogOpen(true)
  }

  const openEditDialog = (melder: Melder) => {
    setEditingMelder(melder)
    setFormData({
      firstName: melder.firstName,
      lastName: melder.lastName,
      title: melder.title || '',
      email: melder.email,
      phone: melder.phone || '',
      affiliation: melder.affiliation,
      fakultaet: melder.fakultaet || '',
      fachbereich: melder.fachbereich || '',
      room: melder.room || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      return
    }
    setSaving(true)
    try {
      const body = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        title: formData.title?.trim() || null,
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        affiliation: formData.affiliation,
        fakultaet: formData.fakultaet?.trim() || null,
        fachbereich: formData.fachbereich?.trim() || null,
        room: formData.room?.trim() || null,
      }
      const response = await fetch('/api/melder/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (response.ok) {
        setDialogOpen(false)
        setEditingMelder(null)
        fetchMelders()
      } else {
        const errBody = await response.json().catch(() => ({}))
        alert(errBody.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Failed to save melder:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const openDeleteDialog = (melder: Melder) => {
    setMelderToDelete(melder)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!melderToDelete) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/melder/${melderToDelete.id}`, { method: 'DELETE' })
      if (response.ok) {
        setDeleteDialogOpen(false)
        setMelderToDelete(null)
        fetchMelders()
      } else {
        const errBody = await response.json().catch(() => ({}))
        alert(errBody.error || 'Fehler beim Löschen')
        if (response.status === 409) {
          setDeleteDialogOpen(false)
          setMelderToDelete(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete melder:', error)
      alert('Fehler beim Löschen')
    } finally {
      setDeleting(false)
    }
  }

  const fullName = (m: Melder) => [m.firstName, m.lastName].filter(Boolean).join(' ')
  const formValid =
    formData.firstName.trim().length > 0 &&
    formData.lastName.trim().length > 0 &&
    formData.email.trim().length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Melder</h1>
          <p className="text-muted-foreground">Übersicht aller registrierten Melder</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Melder
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : melders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Noch keine Melder vorhanden
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: Table layout */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Melder ({melders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Zugehörigkeit</TableHead>
                      <TableHead>Fakultät</TableHead>
                      <TableHead>Fachbereich</TableHead>
                      <TableHead>Veranstaltungen</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {melders.map((melder) => (
                      <TableRow key={melder.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{fullName(melder)}</p>
                            {melder.title && (
                              <p className="text-xs text-muted-foreground">{melder.title}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{melder.email}</TableCell>
                        <TableCell>
                          <Badge variant={affiliationVariants[melder.affiliation] ?? 'outline'}>
                            {affiliationLabels[melder.affiliation] ?? melder.affiliation}
                          </Badge>
                        </TableCell>
                        <TableCell>{melder.fakultaet || '-'}</TableCell>
                        <TableCell>{melder.fachbereich || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{melder._count.events}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(melder)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openDeleteDialog(melder)}
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
              </CardContent>
            </Card>
          </div>

          {/* Mobile: Card layout */}
          <div className="space-y-4 md:hidden">
            {melders.map((melder) => (
              <Card key={melder.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base">{fullName(melder)}</CardTitle>
                      {melder.title && (
                        <p className="text-xs text-muted-foreground mt-0.5">{melder.title}</p>
                      )}
                    </div>
                    <Badge
                      variant={affiliationVariants[melder.affiliation] ?? 'outline'}
                      className="shrink-0"
                    >
                      {affiliationLabels[melder.affiliation] ?? melder.affiliation}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{melder.email}</p>
                  {melder.fakultaet && (
                    <p>
                      <span className="font-medium">Fakultät: </span>
                      {melder.fakultaet}
                    </p>
                  )}
                  {melder.fachbereich && (
                    <p>
                      <span className="font-medium">Fachbereich: </span>
                      {melder.fachbereich}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-muted-foreground">Veranstaltungen:</span>
                    <Badge variant="secondary">{melder._count.events}</Badge>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEditDialog(melder)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Bearbeiten
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-destructive"
                      onClick={() => openDeleteDialog(melder)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Löschen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMelder ? 'Melder bearbeiten' : 'Neuer Melder'}</DialogTitle>
            <DialogDescription>
              {editingMelder
                ? 'Bearbeiten Sie die Daten des Melders.'
                : 'Fügen Sie einen neuen Melder hinzu.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="melder-firstName">
                  Vorname <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="melder-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="melder-lastName">
                  Nachname <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="melder-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="melder-title">Titel</Label>
              <Input
                id="melder-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="z.B. Prof. Dr."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="melder-email">
                E-Mail <span className="text-red-500">*</span>
              </Label>
              <Input
                id="melder-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {editingMelder && (
                <p className="text-xs text-muted-foreground">
                  Hinweis: Der Datensatz wird über die E-Mail identifiziert.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="melder-phone">Telefon</Label>
              <Input
                id="melder-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="melder-affiliation">
                Zugehörigkeit <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.affiliation}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    affiliation: value as MelderFormData['affiliation'],
                  })
                }
              >
                <SelectTrigger id="melder-affiliation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNI">Universität</SelectItem>
                  <SelectItem value="HOCHSCHULE">Hochschule</SelectItem>
                  <SelectItem value="BEIDE">Beide</SelectItem>
                  <SelectItem value="EXTERN">Extern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="melder-fakultaet">Fakultät</Label>
                <Input
                  id="melder-fakultaet"
                  value={formData.fakultaet}
                  onChange={(e) => setFormData({ ...formData, fakultaet: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="melder-fachbereich">Fachbereich</Label>
                <Input
                  id="melder-fachbereich"
                  value={formData.fachbereich}
                  onChange={(e) => setFormData({ ...formData, fachbereich: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="melder-room">Raum</Label>
              <Input
                id="melder-room"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving || !formValid}>
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Melder löschen</DialogTitle>
            <DialogDescription>
              Wirklich löschen? &quot;{melderToDelete ? fullName(melderToDelete) : ''}&quot; wird
              dauerhaft entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setMelderToDelete(null)
              }}
            >
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Löschen...' : 'Bestätigen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
