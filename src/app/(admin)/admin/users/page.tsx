'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface User {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'ORGANIZER' | 'PUBLIC'
  createdAt: string
  updatedAt: string
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  ORGANIZER: 'Organisator',
  PUBLIC: 'Öffentlich',
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  ORGANIZER: 'bg-blue-100 text-blue-800',
  PUBLIC: 'bg-gray-100 text-gray-800',
}

const roleIcons: Record<string, React.ElementType> = {
  ADMIN: Shield,
  ORGANIZER: UserCheck,
  PUBLIC: UserX,
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'ORGANIZER' as 'ADMIN' | 'ORGANIZER' | 'PUBLIC',
    password: '',
  })

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter((user) => {
    if (roleFilter && user.role !== roleFilter) return false
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.name && user.name.toLowerCase().includes(searchLower))
    )
  })

  const openCreateDialog = () => {
    setEditingUser(null)
    setFormData({
      email: '',
      name: '',
      role: 'ORGANIZER',
      password: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      name: user.name || '',
      role: user.role,
      password: '', // Don't show password
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.email.trim()) return
    if (!editingUser && !formData.password) {
      alert('Bitte geben Sie ein Passwort ein')
      return
    }

    setSaving(true)
    try {
      const body: Record<string, string> = {
        email: formData.email.trim(),
        name: formData.name.trim() || '',
        role: formData.role,
      }

      if (formData.password) {
        body.password = formData.password
      }

      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setDialogOpen(false)
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.message || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Failed to save user:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        setUserToDelete(null)
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.message || 'Fehler beim Löschen')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
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
          <h1 className="text-2xl font-bold tracking-tight">Benutzer</h1>
          <p className="text-muted-foreground">Verwalten Sie Benutzerkonten und Berechtigungen</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Benutzer
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Suche &amp; Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Nach E-Mail oder Name suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={roleFilter || '__all__'}
              onValueChange={(v) => setRoleFilter(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle Rollen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Alle Rollen</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="ORGANIZER">Organisator</SelectItem>
                <SelectItem value="PUBLIC">Öffentlich</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Benutzer ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || roleFilter ? 'Keine Benutzer gefunden' : 'Noch keine Benutzer vorhanden'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const RoleIcon = roleIcons[user.role]
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role]}>
                          <RoleIcon className="mr-1 h-3 w-3" />
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.createdAt), 'dd.MM.yyyy', { locale: de })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setUserToDelete(user)
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
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Bearbeiten Sie die Details des Benutzers'
                : 'Fügen Sie einen neuen Benutzer hinzu'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="benutzer@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Max Mustermann"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rolle *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'ADMIN' | 'ORGANIZER' | 'PUBLIC') =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Administrator
                    </div>
                  </SelectItem>
                  <SelectItem value="ORGANIZER">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Organisator
                    </div>
                  </SelectItem>
                  <SelectItem value="PUBLIC">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4" />
                      Öffentlich
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Passwort {editingUser ? '(leer lassen um nicht zu ändern)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? '••••••••' : 'Mindestens 8 Zeichen'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.email.trim() || (!editingUser && !formData.password)}
            >
              {saving ? 'Speichern...' : editingUser ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie den Benutzer &quot;{userToDelete?.email}&quot; löschen
              möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setUserToDelete(null)
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
