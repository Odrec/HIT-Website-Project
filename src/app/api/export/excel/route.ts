import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { auth } from '@/auth'
import { exportService } from '@/services/export-service'
import type { EventRow, MelderRow, LecturerRow, InfomarktRow } from '@/services/export-service'

// ---------------------------------------------------------------------------
// Valid views and filename mapping
// ---------------------------------------------------------------------------

const VALID_VIEWS = [
  'events-az',
  'events-cluster',
  'events-time',
  'events-room',
  'events-building',
  'melders',
  'lecturers',
  'infomaerkte',
] as const

type ViewType = (typeof VALID_VIEWS)[number]

const FILENAME_MAP: Record<ViewType, string> = {
  'events-az': 'veranstaltungen-az',
  'events-cluster': 'veranstaltungen-cluster',
  'events-time': 'veranstaltungen-zeit',
  'events-room': 'veranstaltungen-raum',
  'events-building': 'veranstaltungen-gebaeude',
  melders: 'melder',
  lecturers: 'dozierende',
  infomaerkte: 'infomaerkte',
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const EVENT_COLUMNS: Partial<ExcelJS.Column>[] = [
  { header: 'Titel', key: 'titel', width: 35 },
  { header: 'Typ', key: 'typ', width: 15 },
  { header: 'Institution', key: 'institution', width: 15 },
  { header: 'Studiengänge', key: 'studiengaenge', width: 40 },
  { header: 'Uhrzeit', key: 'uhrzeit', width: 18 },
  { header: 'Gebäude', key: 'gebaeude', width: 20 },
  { header: 'Raum', key: 'raum', width: 15 },
  { header: 'Dozierende', key: 'dozent', width: 30 },
  { header: 'Beschreibung', key: 'beschreibung', width: 50 },
]

const MELDER_COLUMNS: Partial<ExcelJS.Column>[] = [
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Titel', key: 'titel', width: 15 },
  { header: 'E-Mail', key: 'email', width: 30 },
  { header: 'Telefon', key: 'telefon', width: 20 },
  { header: 'Institution', key: 'institution', width: 15 },
  { header: 'Fakultät', key: 'fakultaet', width: 25 },
  { header: 'Fachbereich', key: 'fachbereich', width: 25 },
  { header: 'Raum', key: 'raum', width: 15 },
  { header: 'Anz. Veranstaltungen', key: 'anzahlVeranstaltungen', width: 20 },
]

const LECTURER_COLUMNS: Partial<ExcelJS.Column>[] = [
  { header: 'Name', key: 'name', width: 30 },
  { header: 'Titel', key: 'titel', width: 15 },
  { header: 'E-Mail', key: 'email', width: 30 },
  { header: 'Institution', key: 'institution', width: 15 },
  { header: 'Veranstaltung', key: 'veranstaltung', width: 35 },
  { header: 'Gebäude', key: 'gebaeude', width: 20 },
  { header: 'Raum', key: 'raum', width: 15 },
]

const INFOMARKT_COLUMNS: Partial<ExcelJS.Column>[] = [
  { header: 'Infomarkt', key: 'infomarkt', width: 25 },
  { header: 'Standort', key: 'standort', width: 25 },
  { header: 'Veranstaltung', key: 'veranstaltung', width: 35 },
  { header: 'Institution', key: 'institution', width: 15 },
  { header: 'Studiengänge', key: 'studiengaenge', width: 40 },
  { header: 'Dozierende', key: 'dozent', width: 30 },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sanitise a string for use as an Excel sheet name (max 31 chars, no special chars). */
function sanitizeSheetName(name: string): string {
  return name.replace(/[*?:/\\[\]]/g, '-').slice(0, 31)
}

/** Add a title row (row 1) and a styled header row (row 2) to a worksheet. */
function addTitleAndHeaders(
  sheet: ExcelJS.Worksheet,
  title: string,
  columns: Partial<ExcelJS.Column>[]
) {
  // Set columns (this defines keys for addRow later)
  sheet.columns = columns

  // Row 1 – title (insert before header row which is auto-created at row 1)
  sheet.spliceRows(1, 0, [title])
  const titleRow = sheet.getRow(1)
  titleRow.getCell(1).font = { bold: true, size: 14 }
  // Merge across all columns
  sheet.mergeCells(1, 1, 1, columns.length)

  // Row 2 – header (auto-created by setting columns, now at row 2)
  const headerRow = sheet.getRow(2)
  headerRow.font = { bold: true }
  headerRow.alignment = { vertical: 'middle' }
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }
  })
}

/** Add data rows to a worksheet starting after the header (row 3+). */
function addDataRows(
  sheet: ExcelJS.Worksheet,
  rows: (EventRow | MelderRow | LecturerRow | InfomarktRow)[]
) {
  for (const row of rows) {
    sheet.addRow(row)
  }
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    // Auth check – admin only
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    // Validate view query param
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') as ViewType | null

    if (!view || !VALID_VIEWS.includes(view as ViewType)) {
      return NextResponse.json(
        { error: `Invalid or missing view parameter. Must be one of: ${VALID_VIEWS.join(', ')}` },
        { status: 400 }
      )
    }

    const workbook = new ExcelJS.Workbook()

    switch (view) {
      case 'events-az': {
        const data = await exportService.eventsAZ()
        const sheet = workbook.addWorksheet('Veranstaltungen A-Z')
        addTitleAndHeaders(sheet, 'HIT – Veranstaltungen A-Z', EVENT_COLUMNS)
        addDataRows(sheet, data)
        break
      }

      case 'events-time': {
        const data = await exportService.eventsByTime()
        const sheet = workbook.addWorksheet('Nach Zeit')
        addTitleAndHeaders(sheet, 'HIT – Veranstaltungen nach Zeit', EVENT_COLUMNS)
        addDataRows(sheet, data)
        break
      }

      case 'events-cluster': {
        const grouped = await exportService.eventsByCluster()
        for (const [cluster, rows] of Object.entries(grouped)) {
          const sheet = workbook.addWorksheet(sanitizeSheetName(cluster))
          addTitleAndHeaders(sheet, `HIT – ${cluster}`, EVENT_COLUMNS)
          addDataRows(sheet, rows)
        }
        break
      }

      case 'events-building': {
        const grouped = await exportService.eventsByBuilding()
        for (const [building, rows] of Object.entries(grouped)) {
          const sheet = workbook.addWorksheet(sanitizeSheetName(building))
          addTitleAndHeaders(sheet, `HIT – ${building}`, EVENT_COLUMNS)
          addDataRows(sheet, rows)
        }
        break
      }

      case 'events-room': {
        const grouped = await exportService.eventsByRoom()
        for (const [building, rooms] of Object.entries(grouped)) {
          const sheet = workbook.addWorksheet(sanitizeSheetName(building))
          addTitleAndHeaders(sheet, `HIT – ${building}`, EVENT_COLUMNS)

          let isFirstRoom = true
          for (const [room, rows] of Object.entries(rooms)) {
            // Blank separator row between rooms (not before the first)
            if (!isFirstRoom) {
              sheet.addRow([])
            }
            isFirstRoom = false

            // Room subheader row (bold italic)
            const subheaderRow = sheet.addRow([room])
            subheaderRow.font = { bold: true, italic: true }

            addDataRows(sheet, rows)
          }
        }
        break
      }

      case 'melders': {
        const data = await exportService.melders()
        const sheet = workbook.addWorksheet('Melder')
        addTitleAndHeaders(sheet, 'HIT – Melder', MELDER_COLUMNS)
        addDataRows(sheet, data)
        break
      }

      case 'lecturers': {
        const data = await exportService.lecturers()
        const sheet = workbook.addWorksheet('Dozierende')
        addTitleAndHeaders(sheet, 'HIT – Dozierende', LECTURER_COLUMNS)
        addDataRows(sheet, data)
        break
      }

      case 'infomaerkte': {
        const data = await exportService.infomaerkte()
        const sheet = workbook.addWorksheet('Infomärkte')
        addTitleAndHeaders(sheet, 'HIT – Infomärkte', INFOMARKT_COLUMNS)
        addDataRows(sheet, data)
        break
      }
    }

    // Write to buffer
    const arrayBuffer = await workbook.xlsx.writeBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const today = new Date().toISOString().slice(0, 10)
    const filename = `hit-${FILENAME_MAP[view]}-${today}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating Excel export:', error)
    return NextResponse.json({ error: 'Failed to generate Excel export' }, { status: 500 })
  }
}
