'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Check,
  Loader2,
  FileText,
  BookOpen,
  Clock,
  Building2,
  DoorOpen,
  Users,
  GraduationCap,
  ShoppingBag,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { ExportCard } from '@/components/admin/ExportCard'
import { useToast } from '@/hooks/use-toast'

interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
}

export default function ImportExportPage() {
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [htmlExportLoading, setHtmlExportLoading] = useState(false)
  const [schedule, setSchedule] = useState({ enabled: false, startDate: '', frequency: 'daily' })
  const [scheduleLoading, setScheduleLoading] = useState(false)

  // Load existing schedule
  useEffect(() => {
    fetch('/api/admin/export-schedule')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.startDate) {
          setSchedule({
            enabled: data.enabled,
            startDate: data.startDate.slice(0, 10),
            frequency: data.frequency,
          })
        }
      })
      .catch(() => {})
  }, [])

  const handleHtmlExport = async () => {
    setHtmlExportLoading(true)
    try {
      const response = await fetch('/api/export/html')
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `hit-2026-events-${new Date().toISOString().slice(0, 10)}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({ title: 'Export erstellt', description: 'Die HTML-Datei wurde heruntergeladen.' })
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Export fehlgeschlagen.' })
    } finally {
      setHtmlExportLoading(false)
    }
  }

  const handleSaveSchedule = async () => {
    setScheduleLoading(true)
    try {
      const response = await fetch('/api/admin/export-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      })
      if (!response.ok) throw new Error('Save failed')
      toast({ title: 'Gespeichert', description: 'Export-Zeitplan wurde aktualisiert.' })
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Speichern fehlgeschlagen.' })
    } finally {
      setScheduleLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/events?pageSize=1000')
      const data = await response.json()

      const events = data.data || []
      if (events.length === 0) {
        alert('Keine Veranstaltungen zum Exportieren vorhanden.')
        return
      }

      const headers = [
        'ID',
        'Titel',
        'Beschreibung',
        'Typ',
        'Institution',
        'Beginn',
        'Ende',
        'Ortstyp',
        'Treffpunkt',
        'Zusätzliche Info',
        'Foto-URL',
        'Studiengänge',
        'Dozenten',
        'Studiengangsübergreifend',
        'Ortshinweis',
        'Gebäude',
        'Raum',
        'Melder',
      ]

      const rows = events.map(
        (event: {
          id: string
          title: string
          description: string | null
          eventType: string
          institution: string
          timeStart: string | null
          timeEnd: string | null
          locationType: string
          meetingPoint: string | null
          additionalInfo: string | null
          photoUrl: string | null
          studyPrograms: { studyProgram: { name: string } }[]
          lecturers: { firstName: string; lastName: string; title: string | null }[]
          isCrossProgram?: boolean
          locationHint?: string | null
          building?: { name: string } | null
          room?: { name: string } | null
          melder?: { name: string } | null
        }) => [
          event.id,
          event.title,
          event.description || '',
          event.eventType,
          event.institution,
          event.timeStart || '',
          event.timeEnd || '',
          event.locationType,
          event.meetingPoint || '',
          event.additionalInfo || '',
          event.photoUrl || '',
          event.studyPrograms
            ?.map((sp: { studyProgram: { name: string } }) => sp.studyProgram.name)
            .join('; ') || '',
          event.lecturers
            ?.map((l: { firstName: string; lastName: string; title: string | null }) =>
              `${l.title || ''} ${l.firstName} ${l.lastName}`.trim()
            )
            .join('; ') || '',
          event.isCrossProgram ? 'Ja' : 'Nein',
          event.locationHint || '',
          event.building?.name || '',
          event.room?.name || '',
          event.melder?.name || '',
        ]
      )

      const csvContent = [
        headers.join(','),
        ...rows.map((row: string[]) =>
          row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n')

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `hit-veranstaltungen-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Fehler beim Exportieren der Veranstaltungen.')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter((line) => line.trim())

      if (lines.length < 2) {
        setImportResult({
          success: false,
          imported: 0,
          errors: ['Die Datei enthält keine Daten.'],
        })
        return
      }

      const headers = parseCSVLine(lines[0])
      const titleIndex = headers.findIndex(
        (h) => h.toLowerCase().includes('titel') || h.toLowerCase().includes('title')
      )
      const typeIndex = headers.findIndex(
        (h) => h.toLowerCase().includes('typ') || h.toLowerCase().includes('type')
      )
      const institutionIndex = headers.findIndex((h) => h.toLowerCase().includes('institution'))

      if (titleIndex === -1) {
        setImportResult({
          success: false,
          imported: 0,
          errors: ['Spalte "Titel" nicht gefunden.'],
        })
        return
      }

      const errors: string[] = []
      let imported = 0

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        const title = values[titleIndex]?.trim()

        if (!title) {
          errors.push(`Zeile ${i + 1}: Titel fehlt.`)
          continue
        }

        const eventType = values[typeIndex]?.trim().toUpperCase() || 'VORTRAG'
        const institution = values[institutionIndex]?.trim().toUpperCase() || 'BOTH'

        try {
          const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              eventType: [
                'VORTRAG',
                'LABORFUEHRUNG',
                'RUNDGANG',
                'WORKSHOP',
                'ONLINE',
                'VIDEO',
                'INFOSTAND',
              ].includes(eventType)
                ? eventType
                : 'VORTRAG',
              institution: ['UNI', 'HOCHSCHULE', 'BOTH'].includes(institution)
                ? institution
                : 'BOTH',
              locationType: 'OTHER',
            }),
          })

          if (response.ok) {
            imported++
          } else {
            const errorData = await response.json()
            errors.push(`Zeile ${i + 1}: ${errorData.error || 'Fehler beim Import.'}`)
          }
        } catch {
          errors.push(`Zeile ${i + 1}: Netzwerkfehler.`)
        }
      }

      setImportResult({
        success: errors.length === 0,
        imported,
        errors,
      })
    } catch (error) {
      console.error('Import error:', error)
      setImportResult({
        success: false,
        imported: 0,
        errors: ['Fehler beim Lesen der Datei.'],
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }

    result.push(current)
    return result
  }

  const downloadTemplate = () => {
    const headers = [
      'Titel',
      'Beschreibung',
      'Typ (VORTRAG/LABORFUEHRUNG/RUNDGANG/WORKSHOP/ONLINE/VIDEO/INFOSTAND)',
      'Institution (UNI/HOCHSCHULE/BOTH)',
      'Beginn (ISO 8601)',
      'Ende (ISO 8601)',
      'Treffpunkt',
      'Zusätzliche Info',
    ]

    const example = [
      'Einführung in die Informatik',
      'Vortrag über Grundlagen der Programmierung',
      'VORTRAG',
      'UNI',
      '2026-11-14T10:00:00',
      '2026-11-14T11:00:00',
      'Hörsaal A1',
      'Keine Vorkenntnisse erforderlich',
    ]

    const csvContent = [headers.join(','), example.map((cell) => `"${cell}"`).join(',')].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'hit-import-vorlage.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import / Export</h1>
        <p className="text-gray-500">
          Veranstaltungsdaten importieren und in verschiedenen Formaten exportieren
        </p>
      </div>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Excel-Exporte</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ExportCard
                title="Veranstaltungen A-Z"
                description="Alle Veranstaltungen alphabetisch sortiert"
                icon={FileSpreadsheet}
                href="/api/export/excel?view=events-az"
              />
              <ExportCard
                title="Nach Cluster"
                description="Veranstaltungen gruppiert nach Studienfeld-Cluster"
                icon={GraduationCap}
                href="/api/export/excel?view=events-cluster"
              />
              <ExportCard
                title="Nach Zeit"
                description="Veranstaltungen chronologisch sortiert"
                icon={Clock}
                href="/api/export/excel?view=events-time"
              />
              <ExportCard
                title="Nach Raum"
                description="Veranstaltungen gruppiert nach Gebäude und Raum"
                icon={DoorOpen}
                href="/api/export/excel?view=events-room"
              />
              <ExportCard
                title="Nach Gebäude"
                description="Veranstaltungen gruppiert nach Gebäude"
                icon={Building2}
                href="/api/export/excel?view=events-building"
              />
              <ExportCard
                title="Melder / Ansprechpartner"
                description="Alle Melder mit Kontaktdaten"
                icon={Users}
                href="/api/export/excel?view=melders"
              />
              <ExportCard
                title="Dozierende"
                description="Alle Dozierenden mit Veranstaltungszuordnung"
                icon={Users}
                href="/api/export/excel?view=lecturers"
              />
              <ExportCard
                title="Infomärkte"
                description="Veranstaltungen an Infomärkten"
                icon={ShoppingBag}
                href="/api/export/excel?view=infomaerkte"
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Weitere Formate</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ExportCard
                title="Programm-Broschüre"
                description="Druckfertiges PDF-Programm nach Cluster"
                icon={BookOpen}
                href="/api/export/pdf/booklet"
              />
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-hit-gray-100 p-2">
                      <FileText className="h-5 w-5 text-hit-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">CSV-Export</CardTitle>
                      <CardDescription className="text-xs">
                        Alle Veranstaltungen als CSV-Datei
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                  <Button variant="outline" size="sm" className="w-full" onClick={handleExportCSV}>
                    <FileText className="mr-2 h-4 w-4" />
                    Herunterladen
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">HTML-Backup</h2>
            <div className="mt-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Statisches HTML-Backup</CardTitle>
                  <CardDescription className="text-xs">
                    Erstellen Sie eine statische HTML-Datei mit allen Veranstaltungen als
                    Offline-Backup.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleHtmlExport}
                    disabled={htmlExportLoading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {htmlExportLoading ? 'Wird erstellt...' : 'Jetzt exportieren'}
                  </Button>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm mb-3">Automatischer Export</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
                        />
                        <span className="text-sm">Automatischen Export aktivieren</span>
                      </label>
                      {schedule.enabled && (
                        <div className="flex flex-wrap gap-4 items-end">
                          <div>
                            <label className="text-xs text-muted-foreground">Startdatum</label>
                            <Input
                              type="date"
                              value={schedule.startDate}
                              onChange={(e) =>
                                setSchedule({ ...schedule, startDate: e.target.value })
                              }
                              className="w-auto"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Häufigkeit</label>
                            <select
                              value={schedule.frequency}
                              onChange={(e) =>
                                setSchedule({ ...schedule, frequency: e.target.value })
                              }
                              className="rounded-md border bg-white px-3 py-2 text-sm h-10"
                            >
                              <option value="daily">Täglich</option>
                              <option value="weekly">Wöchentlich</option>
                            </select>
                          </div>
                          <Button
                            onClick={handleSaveSchedule}
                            disabled={scheduleLoading}
                            variant="outline"
                            size="sm"
                          >
                            {scheduleLoading ? 'Speichern...' : 'Speichern'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Veranstaltungen importieren</CardTitle>
              <CardDescription>
                Importieren Sie Veranstaltungen aus einer CSV-Datei.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">CSV-Import</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Laden Sie eine CSV-Datei mit Veranstaltungsdaten hoch.
                </p>
                <div className="mt-4 flex justify-center gap-4">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Vorlage herunterladen
                  </Button>
                  <Button
                    variant="uni"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                  >
                    {importing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importiere...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        CSV hochladen
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {importResult && (
                <div
                  className={`rounded-lg p-4 ${
                    importResult.success
                      ? 'bg-green-50 text-green-700'
                      : importResult.imported > 0
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-red-50 text-red-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {importResult.success ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <span className="font-medium">
                      {importResult.imported} Veranstaltung(en) importiert
                    </span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Fehler:</p>
                      <ul className="mt-1 list-inside list-disc text-sm">
                        {importResult.errors.slice(0, 10).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li>...und {importResult.errors.length - 10} weitere Fehler</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="font-medium">Hinweise zum Import</h4>
                <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
                  <li>Die erste Zeile muss Spaltenüberschriften enthalten</li>
                  <li>Mindestens die Spalte &quot;Titel&quot; muss vorhanden sein</li>
                  <li>Typ: VORTRAG, LABORFUEHRUNG, RUNDGANG, WORKSHOP, ONLINE, VIDEO, INFOSTAND</li>
                  <li>Institution: UNI, HOCHSCHULE, BOTH</li>
                  <li>Datums-Format: ISO 8601 (z.B. 2026-11-14T10:00:00)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
