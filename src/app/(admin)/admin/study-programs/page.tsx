'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  GraduationCap,
  Folder,
  Building2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Cluster {
  id: string
  name: string
  description: string | null
}

interface StudyProgram {
  id: string
  name: string
  institution: 'UNI' | 'HOCHSCHULE' | 'BOTH'
  clusterId: string | null
  cluster: Cluster | null
  createdAt: string
  updatedAt: string
}

const institutionLabels: Record<string, string> = {
  UNI: 'Universität',
  HOCHSCHULE: 'Hochschule',
  BOTH: 'Beide',
}

const institutionColors: Record<string, string> = {
  UNI: 'bg-blue-100 text-blue-800',
  HOCHSCHULE: 'bg-green-100 text-green-800',
  BOTH: 'bg-purple-100 text-purple-800',
}

export default function StudyProgramsPage() {
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [institutionFilter, setInstitutionFilter] = useState<string>('')

  // Study Program Dialog
  const [programDialogOpen, setProgramDialogOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<StudyProgram | null>(null)
  const [savingProgram, setSavingProgram] = useState(false)
  const [programFormData, setProgramFormData] = useState({
    name: '',
    institution: 'UNI' as 'UNI' | 'HOCHSCHULE' | 'BOTH',
    clusterId: '',
  })

  // Cluster Dialog
  const [clusterDialogOpen, setClusterDialogOpen] = useState(false)
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null)
  const [savingCluster, setSavingCluster] = useState(false)
  const [clusterFormData, setClusterFormData] = useState({
    name: '',
    description: '',
  })

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'program' | 'cluster'
    item: StudyProgram | Cluster
  } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [programsRes, clustersRes] = await Promise.all([
        fetch('/api/study-programs'),
        fetch('/api/study-programs/clusters'),
      ])

      if (programsRes.ok) {
        const data = await programsRes.json()
        setStudyPrograms(data)
      }

      if (clustersRes.ok) {
        const data = await clustersRes.json()
        setClusters(data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredPrograms = studyPrograms.filter((prog) => {
    if (institutionFilter && prog.institution !== institutionFilter) return false
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      prog.name.toLowerCase().includes(searchLower) ||
      (prog.cluster && prog.cluster.name.toLowerCase().includes(searchLower))
    )
  })

  // Study Program handlers
  const openCreateProgramDialog = () => {
    setEditingProgram(null)
    setProgramFormData({
      name: '',
      institution: 'UNI',
      clusterId: '',
    })
    setProgramDialogOpen(true)
  }

  const openEditProgramDialog = (program: StudyProgram) => {
    setEditingProgram(program)
    setProgramFormData({
      name: program.name,
      institution: program.institution,
      clusterId: program.clusterId || '',
    })
    setProgramDialogOpen(true)
  }

  const handleSaveProgram = async () => {
    if (!programFormData.name.trim()) return

    setSavingProgram(true)
    try {
      const body = {
        name: programFormData.name.trim(),
        institution: programFormData.institution,
        clusterId: programFormData.clusterId || null,
      }

      const url = editingProgram
        ? `/api/study-programs/${editingProgram.id}`
        : '/api/study-programs'
      const method = editingProgram ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setProgramDialogOpen(false)
        fetchData()
      } else {
        const error = await response.json()
        alert(error.message || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Failed to save study program:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSavingProgram(false)
    }
  }

  // Cluster handlers
  const openCreateClusterDialog = () => {
    setEditingCluster(null)
    setClusterFormData({
      name: '',
      description: '',
    })
    setClusterDialogOpen(true)
  }

  const openEditClusterDialog = (cluster: Cluster) => {
    setEditingCluster(cluster)
    setClusterFormData({
      name: cluster.name,
      description: cluster.description || '',
    })
    setClusterDialogOpen(true)
  }

  const handleSaveCluster = async () => {
    if (!clusterFormData.name.trim()) return

    setSavingCluster(true)
    try {
      const body = {
        name: clusterFormData.name.trim(),
        description: clusterFormData.description.trim() || null,
      }

      const url = editingCluster
        ? `/api/study-programs/clusters/${editingCluster.id}`
        : '/api/study-programs/clusters'
      const method = editingCluster ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setClusterDialogOpen(false)
        fetchData()
      } else {
        const error = await response.json()
        alert(error.message || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Failed to save cluster:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSavingCluster(false)
    }
  }

  // Delete handler
  const handleDelete = async () => {
    if (!itemToDelete) return

    setDeleting(true)
    try {
      const url =
        itemToDelete.type === 'program'
          ? `/api/study-programs/${itemToDelete.item.id}`
          : `/api/study-programs/clusters/${itemToDelete.item.id}`

      const response = await fetch(url, { method: 'DELETE' })

      if (response.ok) {
        setDeleteDialogOpen(false)
        setItemToDelete(null)
        fetchData()
      } else {
        const error = await response.json()
        alert(error.message || 'Fehler beim Löschen')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
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
          <h1 className="text-2xl font-bold tracking-tight">Studiengänge</h1>
          <p className="text-muted-foreground">Verwalten Sie Studiengänge und Cluster</p>
        </div>
      </div>

      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="programs" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Studiengänge
          </TabsTrigger>
          <TabsTrigger value="clusters" className="gap-2">
            <Folder className="h-4 w-4" />
            Cluster
          </TabsTrigger>
        </TabsList>

        {/* Study Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          {/* Actions */}
          <div className="flex justify-end">
            <Button onClick={openCreateProgramDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Studiengang
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
                    placeholder="Nach Studiengang oder Cluster suchen..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select
                  value={institutionFilter || '__all__'}
                  onValueChange={(v) => setInstitutionFilter(v === '__all__' ? '' : v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Alle Institutionen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Alle Institutionen</SelectItem>
                    <SelectItem value="UNI">Universität</SelectItem>
                    <SelectItem value="HOCHSCHULE">Hochschule</SelectItem>
                    <SelectItem value="BOTH">Beide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Programs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Studiengänge ({filteredPrograms.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredPrograms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {search || institutionFilter
                    ? 'Keine Studiengänge gefunden'
                    : 'Noch keine Studiengänge vorhanden'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Cluster</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrograms.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            {program.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={institutionColors[program.institution]}>
                            {institutionLabels[program.institution]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {program.cluster ? (
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4 text-muted-foreground" />
                              {program.cluster.name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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
                              <DropdownMenuItem onClick={() => openEditProgramDialog(program)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setItemToDelete({ type: 'program', item: program })
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
        </TabsContent>

        {/* Clusters Tab */}
        <TabsContent value="clusters" className="space-y-4">
          {/* Actions */}
          <div className="flex justify-end">
            <Button onClick={openCreateClusterDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Cluster
            </Button>
          </div>

          {/* Clusters Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Cluster ({clusters.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : clusters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Noch keine Cluster vorhanden
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead>Studiengänge</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clusters.map((cluster) => {
                      const programCount = studyPrograms.filter(
                        (p) => p.clusterId === cluster.id
                      ).length
                      return (
                        <TableRow key={cluster.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4 text-muted-foreground" />
                              {cluster.name}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {cluster.description || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{programCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditClusterDialog(cluster)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setItemToDelete({ type: 'cluster', item: cluster })
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
        </TabsContent>
      </Tabs>

      {/* Study Program Dialog */}
      <Dialog open={programDialogOpen} onOpenChange={setProgramDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProgram ? 'Studiengang bearbeiten' : 'Neuer Studiengang'}
            </DialogTitle>
            <DialogDescription>
              {editingProgram
                ? 'Bearbeiten Sie die Details des Studiengangs'
                : 'Fügen Sie einen neuen Studiengang hinzu'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="programName">Name *</Label>
              <Input
                id="programName"
                value={programFormData.name}
                onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                placeholder="z.B. Informatik, BWL, Maschinenbau"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Institution *</Label>
              <Select
                value={programFormData.institution}
                onValueChange={(value: 'UNI' | 'HOCHSCHULE' | 'BOTH') =>
                  setProgramFormData({ ...programFormData, institution: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNI">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Universität
                    </div>
                  </SelectItem>
                  <SelectItem value="HOCHSCHULE">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Hochschule
                    </div>
                  </SelectItem>
                  <SelectItem value="BOTH">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Beide
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cluster">Cluster</Label>
              <Select
                value={programFormData.clusterId || '__none__'}
                onValueChange={(value) =>
                  setProgramFormData({
                    ...programFormData,
                    clusterId: value === '__none__' ? '' : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kein Cluster" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Kein Cluster</SelectItem>
                  {clusters.map((cluster) => (
                    <SelectItem key={cluster.id} value={cluster.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {cluster.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgramDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveProgram}
              disabled={savingProgram || !programFormData.name.trim()}
            >
              {savingProgram ? 'Speichern...' : editingProgram ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cluster Dialog */}
      <Dialog open={clusterDialogOpen} onOpenChange={setClusterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCluster ? 'Cluster bearbeiten' : 'Neuer Cluster'}</DialogTitle>
            <DialogDescription>
              {editingCluster
                ? 'Bearbeiten Sie die Details des Clusters'
                : 'Fügen Sie einen neuen Cluster hinzu'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clusterName">Name *</Label>
              <Input
                id="clusterName"
                value={clusterFormData.name}
                onChange={(e) => setClusterFormData({ ...clusterFormData, name: e.target.value })}
                placeholder="z.B. Naturwissenschaften, Wirtschaft"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clusterDescription">Beschreibung</Label>
              <Input
                id="clusterDescription"
                value={clusterFormData.description}
                onChange={(e) =>
                  setClusterFormData({ ...clusterFormData, description: e.target.value })
                }
                placeholder="Optionale Beschreibung des Clusters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClusterDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveCluster}
              disabled={savingCluster || !clusterFormData.name.trim()}
            >
              {savingCluster ? 'Speichern...' : editingCluster ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {itemToDelete?.type === 'program' ? 'Studiengang löschen' : 'Cluster löschen'}
            </DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie &quot;{itemToDelete?.item.name}&quot; löschen möchten? Diese
              Aktion kann nicht rückgängig gemacht werden.
              {itemToDelete?.type === 'cluster' && (
                <span className="block mt-2 text-amber-600">
                  Hinweis: Die zugehörigen Studiengänge werden nicht gelöscht, sondern nur vom
                  Cluster getrennt.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setItemToDelete(null)
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
