'use client'

import { useState, useRef } from 'react'
import { Upload, Download, FileSpreadsheet, AlertCircle, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
}

export default function ImportExportPage() {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportEvents = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/events?pageSize=1000')
      const data = await response.json()

      // Convert to CSV
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
        ]
      )

      const csvContent = [
        headers.join(','),
        ...rows.map((row: string[]) =>
          row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n')

      // Download file
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
    } finally {
      setExporting(false)
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

      // Parse CSV
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
                'LINK',
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

  // Simple CSV line parser
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
      'Typ (VORTRAG/LABORFUEHRUNG/RUNDGANG/WORKSHOP/LINK/INFOSTAND)',
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
        <p className="text-gray-500">Veranstaltungen als CSV importieren oder exportieren</p>
      </div>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export">
            <Download className="mr-2 h-4 w-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Veranstaltungen exportieren</CardTitle>
              <CardDescription>
                Exportieren Sie alle Veranstaltungen als CSV-Datei für Excel oder andere Programme.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">CSV-Export</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Alle Veranstaltungen werden mit vollständigen Details exportiert.
                </p>
                <Button
                  onClick={handleExportEvents}
                  disabled={exporting}
                  className="mt-4"
                  variant="uni"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exportiere...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Veranstaltungen exportieren
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
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
                  <li>Typ: VORTRAG, LABORFUEHRUNG, RUNDGANG, WORKSHOP, LINK, INFOSTAND</li>
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
