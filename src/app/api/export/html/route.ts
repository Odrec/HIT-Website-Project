import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import type { EventType, Institution } from '@prisma/client'

// ---------------------------------------------------------------------------
// Event include shape
// ---------------------------------------------------------------------------

const eventInclude = {
  location: true,
  lecturers: true,
  organizers: true,
  melder: true,
  building: true,
  room: { include: { building: true } },
  studyPrograms: { include: { studyProgram: true } },
  infoMarkets: { include: { market: true } },
} as const

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

function labelEventType(type: EventType): string {
  const map: Record<EventType, string> = {
    VORTRAG: 'Vortrag',
    LABORFUEHRUNG: 'Laborführung',
    RUNDGANG: 'Rundgang',
    WORKSHOP: 'Workshop',
    ONLINE: 'Online',
    VIDEO: 'Video',
    INFOSTAND: 'Infostand',
  }
  return map[type] ?? String(type)
}

function labelInstitution(institution: Institution): string {
  switch (institution) {
    case 'UNI':
      return 'Universität Osnabrück'
    case 'HOCHSCHULE':
      return 'Hochschule Osnabrück'
    case 'BOTH':
      return 'Beide'
    default:
      return String(institution)
  }
}

function formatTime(date: Date | null): string {
  if (!date) return ''
  return format(date, 'HH:mm', { locale: de })
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---------------------------------------------------------------------------
// HTML generation
// ---------------------------------------------------------------------------

type EventWithRelations = Awaited<
  ReturnType<typeof prisma.event.findMany<{ include: typeof eventInclude }>>
>[number]

function generateHtml(events: EventWithRelations[], generatedAt: Date): string {
  const dateStr = format(generatedAt, 'dd.MM.yyyy HH:mm', { locale: de })
  const fileDate = format(generatedAt, 'yyyy-MM-dd')

  const rows = events
    .map((event) => {
      const titel = esc(event.title)
      const typ = esc(labelEventType(event.eventType))
      const institution = esc(labelInstitution(event.institution))

      const timeStart = formatTime(event.timeStart ?? null)
      const timeEnd = formatTime(event.timeEnd ?? null)
      const zeit = timeEnd ? `${timeStart} – ${timeEnd}` : timeStart

      const ort = esc(event.room?.name ?? event.building?.name ?? '')

      const vortragende = esc(
        event.lecturers
          .map((l) => [l.title, l.firstName, l.lastName].filter(Boolean).join(' '))
          .join(', ')
      )

      const studiengaenge = esc(
        event.studyPrograms
          .map((esp) => esp.studyProgram.name)
          .sort()
          .join(', ')
      )

      return `
      <tr>
        <td>${titel}</td>
        <td>${typ}</td>
        <td>${institution}</td>
        <td>${esc(zeit)}</td>
        <td>${ort}</td>
        <td>${vortragende}</td>
        <td>${studiengaenge}</td>
      </tr>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HIT 2026 — Alle Veranstaltungen</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #222;
      padding: 24px;
    }
    h1 {
      font-size: 20px;
      margin-bottom: 4px;
      color: #AC0634;
    }
    .subtitle {
      font-size: 11px;
      color: #555;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead tr {
      background-color: #AC0634;
      color: #fff;
    }
    thead th {
      padding: 6px 8px;
      text-align: left;
      font-weight: bold;
    }
    tbody tr:nth-child(even) {
      background-color: #f5f5f5;
    }
    tbody td {
      padding: 5px 8px;
      border-bottom: 1px solid #e0e0e0;
      vertical-align: top;
    }
    @media print {
      body { padding: 8px; }
      thead tr { background-color: #AC0634 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <h1>HIT 2026 — Alle Veranstaltungen</h1>
  <p class="subtitle">Erstellt am ${esc(dateStr)} · ${events.length} Veranstaltungen · Exportdatei: hit-2026-events-${esc(fileDate)}.html</p>
  <table>
    <thead>
      <tr>
        <th>Titel</th>
        <th>Typ</th>
        <th>Institution</th>
        <th>Zeit</th>
        <th>Ort</th>
        <th>Vortragende</th>
        <th>Studiengänge</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const apiKey = searchParams.get('key')
  const exportApiKey = process.env.EXPORT_API_KEY

  // Allow access via API key
  const hasValidApiKey = exportApiKey && apiKey === exportApiKey

  if (!hasValidApiKey) {
    // Fall back to session auth (admin only)
    const session = await auth()
    if (!session || (session as { user?: { role?: string } }).user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const events = await prisma.event.findMany({
    include: eventInclude,
    orderBy: { title: 'asc' },
  })

  const generatedAt = new Date()
  const html = generateHtml(events, generatedAt)
  const fileDate = format(generatedAt, 'yyyy-MM-dd')

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="hit-2026-events-${fileDate}.html"`,
    },
  })
}
