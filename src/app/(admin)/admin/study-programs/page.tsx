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
  ExternalLink,
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
import { LEHRAMT_TYP_LABELS, LEHRAMT_TYP_VALUES } from '@/lib/lehramt'

interface Cluster {
  id: string
  name: string
  description: string | null
  institution: 'UNI' | 'HOCHSCHULE' | 'BOTH'
  sortOrder: number
}

interface StudyProgram {
  id: string
  name: string
  institution: 'UNI' | 'HOCHSCHULE' | 'BOTH'
  links: Array<{ label: string; url: string }>
  clusters: Cluster[]
  lehramtTypen: Array<'GRUND_HAUPT_REAL' | 'GYMNASIUM' | 'BERUFSBILDEND'>
  isLehramtStudiengang: boolean
  isBeruflicheFachrichtung: boolean
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
    links: [] as Array<{ label: string; url: string }>,
    clusterIds: [] as string[],
    lehramtTypen: [] as Array<'GRUND_HAUPT_REAL' | 'GYMNASIUM' | 'BERUFSBILDEND'>,
    isLehramtStudiengang: false,
    isBeruflicheFachrichtung: false,
  })

  // Cluster Dialog
  const [clusterDialogOpen, setClusterDialogOpen] = useState(false)
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null)
  const [savingCluster, setSavingCluster] = useState(false)
  const [clusterFormData, setClusterFormData] = useState({
    name: '',
    description: '',
    institution: 'UNI' as 'UNI' | 'HOCHSCHULE' | 'BOTH',
    sortOrder: 0,
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
      prog.clusters.some((c) => c.name.toLowerCase().includes(searchLower))
    )
  })

  // Only offer the Studienfelder that belong to the program's institution
  // (cross-institution "BOTH" clusters always fit). Prevents mis-assigning a
  // Uni programme to a Hochschule field and vice versa.
  const clusterFitsInstitution = (cluster: Cluster, institution: 'UNI' | 'HOCHSCHULE' | 'BOTH') =>
    institution === 'BOTH' || cluster.institution === 'BOTH' || cluster.institution === institution

  const visibleClusters = clusters.filter((c) =>
    clusterFitsInstitution(c, programFormData.institution)
  )

  // Study Program handlers
  const openCreateProgramDialog = () => {
    setEditingProgram(null)
    setProgramFormData({
      name: '',
      institution: 'UNI',
      links: [],
      clusterIds: [],
      lehramtTypen: [],
      isLehramtStudiengang: false,
      isBeruflicheFachrichtung: false,
    })
    setProgramDialogOpen(true)
  }

  const openEditProgramDialog = (program: StudyProgram) => {
    setEditingProgram(program)
    setProgramFormData({
      name: program.name,
      institution: program.institution,
      links: program.links.map((l) => ({ label: l.label, url: l.url })),
      clusterIds: program.clusters.map((c) => c.id),
      lehramtTypen: program.lehramtTypen ?? [],
      isLehramtStudiengang: program.isLehramtStudiengang,
      isBeruflicheFachrichtung: program.isBeruflicheFachrichtung,
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
        links: programFormData.links
          .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
          .filter((l) => l.url),
        clusterIds: programFormData.clusterIds,
        lehramtTypen: programFormData.lehramtTypen,
        isLehramtStudiengang: programFormData.isLehramtStudiengang,
        isBeruflicheFachrichtung: programFormData.isBeruflicheFachrichtung,
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
      institution: 'UNI',
      sortOrder: 0,
    })
    setClusterDialogOpen(true)
  }

  const openEditClusterDialog = (cluster: Cluster) => {
    setEditingCluster(cluster)
    setClusterFormData({
      name: cluster.name,
      description: cluster.description || '',
      institution: cluster.institution,
      sortOrder: cluster.sortOrder ?? 0,
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
        institution: clusterFormData.institution,
        sortOrder: clusterFormData.sortOrder,
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
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || errorData.message || 'Fehler beim Speichern')
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
          <p className="text-muted-foreground">Verwalten Sie Studiengänge und Studienfelder</p>
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
            Studienfelder
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
                    placeholder="Nach Studiengang oder Studienfeld suchen..."
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
                      <TableHead>Studienfeld</TableHead>
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
                            {program.links.length > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 text-muted-foreground"
                                title={program.links.map((l) => l.label).join(', ')}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {program.links.length > 1 && (
                                  <span className="text-xs">{program.links.length}</span>
                                )}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={institutionColors[program.institution]}>
                            {institutionLabels[program.institution]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {program.clusters.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Folder className="h-4 w-4 text-muted-foreground" />
                              {program.clusters.map((c) => (
                                <Badge key={c.id} variant="secondary" className="font-normal">
                                  {c.name}
                                </Badge>
                              ))}
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
                Studienfelder ({clusters.length})
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
                  Noch keine Studienfelder vorhanden
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
                      const programCount = studyPrograms.filter((p) =>
                        p.clusters.some((c) => c.id === cluster.id)
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
                  setProgramFormData((prev) => ({
                    ...prev,
                    institution: value,
                    // Drop any selected Studienfeld that no longer fits the
                    // newly chosen institution.
                    clusterIds: prev.clusterIds.filter((id) => {
                      const c = clusters.find((cl) => cl.id === id)
                      return !c || clusterFitsInstitution(c, value)
                    }),
                  }))
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
              <Label>Website-Links</Label>
              <p className="text-xs text-muted-foreground">
                Beschriftete Links zur Studiengang-Seite der Uni/Hochschule (Fach,
                2-Fächer-Bachelor, BEU, LBS …). Reihenfolge = Anzeigereihenfolge.
              </p>
              <div className="space-y-2">
                {programFormData.links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      aria-label={`Link-Bezeichnung ${index + 1}`}
                      className="w-1/3"
                      value={link.label}
                      onChange={(e) =>
                        setProgramFormData((prev) => ({
                          ...prev,
                          links: prev.links.map((l, i) =>
                            i === index ? { ...l, label: e.target.value } : l
                          ),
                        }))
                      }
                      placeholder="Bezeichnung"
                    />
                    <Input
                      aria-label={`Link-URL ${index + 1}`}
                      className="flex-1"
                      type="url"
                      value={link.url}
                      onChange={(e) =>
                        setProgramFormData((prev) => ({
                          ...prev,
                          links: prev.links.map((l, i) =>
                            i === index ? { ...l, url: e.target.value } : l
                          ),
                        }))
                      }
                      placeholder="https://..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setProgramFormData((prev) => ({
                          ...prev,
                          links: prev.links.filter((_, i) => i !== index),
                        }))
                      }
                      aria-label={`Link ${index + 1} entfernen`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setProgramFormData((prev) => ({
                      ...prev,
                      links: [...prev.links, { label: '', url: '' }],
                    }))
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Link hinzufügen
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Studienfelder</Label>
              <p className="text-xs text-muted-foreground">
                Ein Studiengang kann mehreren Studienfeldern zugeordnet werden und erscheint dann in
                jedem.
              </p>
              <div className="space-y-2 rounded-md border p-3">
                {visibleClusters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Keine Studienfelder für diese Institution vorhanden
                  </p>
                ) : (
                  visibleClusters.map((cluster) => {
                    const checked = programFormData.clusterIds.includes(cluster.id)
                    return (
                      <label
                        key={cluster.id}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={(e) => {
                            setProgramFormData((prev) => ({
                              ...prev,
                              clusterIds: e.target.checked
                                ? [...prev.clusterIds, cluster.id]
                                : prev.clusterIds.filter((id) => id !== cluster.id),
                            }))
                          }}
                        />
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span>{cluster.name}</span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lehramt</Label>
              <p className="text-xs text-muted-foreground">
                Schulformen, denen dieser Studiengang zugeordnet ist. Ein Unterrichtsfach kann
                mehreren Schulformen zugeordnet werden.
              </p>
              <div className="space-y-2 rounded-md border p-3">
                {LEHRAMT_TYP_VALUES.map((typ) => (
                  <label key={typ} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={programFormData.lehramtTypen.includes(typ)}
                      onChange={(e) =>
                        setProgramFormData((prev) => {
                          const lehramtTypen = e.target.checked
                            ? [...prev.lehramtTypen, typ]
                            : prev.lehramtTypen.filter((t) => t !== typ)
                          // Berufliche Fachrichtung only valid while BERUFSBILDEND is selected
                          const stillBbs = lehramtTypen.includes('BERUFSBILDEND')
                          return {
                            ...prev,
                            lehramtTypen,
                            isBeruflicheFachrichtung: stillBbs
                              ? prev.isBeruflicheFachrichtung
                              : false,
                          }
                        })
                      }
                    />
                    <span>{LEHRAMT_TYP_LABELS[typ]}</span>
                  </label>
                ))}
              </div>
              {programFormData.lehramtTypen.length > 0 && (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={programFormData.isLehramtStudiengang}
                    onChange={(e) =>
                      setProgramFormData((prev) => ({
                        ...prev,
                        isLehramtStudiengang: e.target.checked,
                        // A Lehramt-Studiengang is not a berufliche Fachrichtung
                        ...(e.target.checked ? { isBeruflicheFachrichtung: false } : {}),
                      }))
                    }
                  />
                  <span>Ist Lehramts-Studiengang (kein Unterrichtsfach)</span>
                </label>
              )}
              {programFormData.lehramtTypen.includes('BERUFSBILDEND') &&
                !programFormData.isLehramtStudiengang && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={programFormData.isBeruflicheFachrichtung}
                      onChange={(e) =>
                        setProgramFormData((prev) => ({
                          ...prev,
                          isBeruflicheFachrichtung: e.target.checked,
                        }))
                      }
                    />
                    <span>Berufliche Fachrichtung</span>
                  </label>
                )}
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
            <DialogTitle>
              {editingCluster ? 'Studienfeld bearbeiten' : 'Neues Studienfeld'}
            </DialogTitle>
            <DialogDescription>
              {editingCluster
                ? 'Bearbeiten Sie die Details des Studienfelds'
                : 'Fügen Sie ein neues Studienfeld hinzu'}
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
            <div className="space-y-1.5">
              <Label htmlFor="cluster-institution">
                Zugehörigkeit <span className="text-red-500">*</span>
              </Label>
              <Select
                value={clusterFormData.institution}
                onValueChange={(v) =>
                  setClusterFormData({
                    ...clusterFormData,
                    institution: v as 'UNI' | 'HOCHSCHULE' | 'BOTH',
                  })
                }
              >
                <SelectTrigger id="cluster-institution">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNI">Universität</SelectItem>
                  <SelectItem value="HOCHSCHULE">Hochschule</SelectItem>
                  <SelectItem value="BOTH">Universität & Hochschule</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cluster-sortorder">Reihenfolge</Label>
              <Input
                id="cluster-sortorder"
                type="number"
                value={clusterFormData.sortOrder}
                onChange={(e) =>
                  setClusterFormData({
                    ...clusterFormData,
                    sortOrder: Number.parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Niedrigere Zahlen erscheinen weiter oben. Standard: 0.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clusterDescription">Beschreibung</Label>
              <Input
                id="clusterDescription"
                value={clusterFormData.description}
                onChange={(e) =>
                  setClusterFormData({ ...clusterFormData, description: e.target.value })
                }
                placeholder="Optionale Beschreibung des Studienfelds"
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
              {itemToDelete?.type === 'program' ? 'Studiengang löschen' : 'Studienfeld löschen'}
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
