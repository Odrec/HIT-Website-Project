'use client'

import { useCallback, useEffect, useState } from 'react'
import { BadgeCheck, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Title {
  id: string
  value: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export default function TitlesPage() {
  const [titles, setTitles] = useState<Title[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState<Title | null>(null)
  const [saving, setSaving] = useState(false)
  const [formValue, setFormValue] = useState('')
  const [formSortOrder, setFormSortOrder] = useState<number>(0)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Title | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTitles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/titles')
      if (res.ok) {
        setTitles(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch titles:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTitles()
  }, [fetchTitles])

  const openCreate = () => {
    setEditingTitle(null)
    setFormValue('')
    const nextOrder = titles.length > 0 ? Math.max(...titles.map((t) => t.sortOrder)) + 10 : 10
    setFormSortOrder(nextOrder)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (title: Title) => {
    setEditingTitle(title)
    setFormValue(title.value)
    setFormSortOrder(title.sortOrder)
    setFormError(null)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const value = formValue.trim()
    if (!value) {
      setFormError('Wert ist erforderlich')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const url = editingTitle ? `/api/titles/${editingTitle.id}` : '/api/titles'
      const method = editingTitle ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, sortOrder: formSortOrder }),
      })
      if (res.ok) {
        setDialogOpen(false)
        fetchTitles()
      } else {
        const data = await res.json().catch(() => null)
        setFormError(data?.error ?? 'Fehler beim Speichern')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/titles/${toDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteDialogOpen(false)
        setToDelete(null)
        fetchTitles()
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Titel</h1>
          <p className="text-muted-foreground">
            Akademische Titel für Melder und Dozierende. Werden als Vorschläge im Formular
            angezeigt; eingegebene Werte bleiben frei wählbar.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Titel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BadgeCheck className="h-5 w-5" />
            Titel ({titles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : titles.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">Noch keine Titel angelegt</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wert</TableHead>
                  <TableHead className="w-32">Sortierung</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {titles.map((title) => (
                  <TableRow key={title.id}>
                    <TableCell className="font-medium">{title.value}</TableCell>
                    <TableCell>{title.sortOrder}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(title)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setToDelete(title)
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

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTitle ? 'Titel bearbeiten' : 'Neuer Titel'}</DialogTitle>
            <DialogDescription>
              Ein kurzer Titel wie &quot;Dr.&quot;, &quot;Prof. Dr.&quot; oder &quot;M.Sc.&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titleValue">Wert *</Label>
              <Input
                id="titleValue"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder="z.B. Prof. Dr."
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleSortOrder">Sortierung</Label>
              <Input
                id="titleSortOrder"
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Niedrigere Werte erscheinen weiter oben in der Vorschlagsliste.
              </p>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving || !formValue.trim()}>
              {saving ? 'Speichern…' : editingTitle ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Titel löschen</DialogTitle>
            <DialogDescription>
              Wollen Sie &quot;{toDelete?.value}&quot; löschen? Bestehende Einträge auf Melder- oder
              Dozenten-Profilen sind nicht betroffen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Löschen…' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
