import { formatEventTime, formatEventDateTime } from '@/lib/event-time'
import type { Building, Room, Melder, Lecturer, StudyProgram } from '@/types/events'
import { EventType, Institution } from '@/types/events'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailContent {
  subject: string
  html: string
}

export interface Change {
  field: string
  oldValue: unknown
  newValue: unknown
}

/** Shape of an event as it arrives from the API (Prisma include). */
export interface EmailEvent {
  id: string
  title: string
  description?: string | null
  eventType: EventType
  institution: Institution
  timeStart?: Date
  timeEnd?: Date
  building?: Building | null
  room?: Room | null
  buildingId?: string | null
  roomId?: string | null
  melder?: Melder | null
  melderId?: string | null
  lecturers?: Lecturer[]
  /** Prisma many-to-many join shape */
  studyPrograms?: { studyProgramId: string; studyProgram: StudyProgram }[]
  createdAt: Date
  updatedAt: Date
  [key: string]: unknown
}

// ─── Label Maps ───────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  VORTRAG: 'Vortrag',
  LABORFUEHRUNG: 'Laborführung',
  RUNDGANG: 'Rundgang',
  WORKSHOP: 'Workshop',
  ONLINE: 'Online',
  VIDEO: 'Video',
  INFOSTAND: 'Infostand',
  // kept for backwards compat / task spec
  FUEHRUNG: 'Führung',
  BERATUNG: 'Beratung',
  INFOMARKT: 'Infomarkt',
  SONSTIGES: 'Sonstiges',
}

const INSTITUTION_LABELS: Record<string, string> = {
  UNI: 'Universität Osnabrück',
  HOCHSCHULE: 'Hochschule Osnabrück',
  BOTH: 'Hochschulübergreifend',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date | undefined): string {
  if (!date) return '—'
  return formatEventTime(date)
}

function formatLecturerName(lecturer: Lecturer): string {
  const parts: string[] = []
  if (lecturer.title) parts.push(lecturer.title)
  parts.push(lecturer.firstName, lecturer.lastName)
  return parts.join(' ')
}

function formatLocation(event: EmailEvent): string {
  const parts: string[] = []
  if (event.building?.name) parts.push(event.building.name)
  if (event.room?.name) parts.push(event.room.name)
  return parts.join(', ') || '—'
}

function adminUrl(path = ''): string {
  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  return `${base.replace(/\/$/, '')}${path}`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function safe(value: unknown): string {
  if (value === null || value === undefined) return '—'
  return escapeHtml(String(value))
}

// ─── Shared Email Partials ────────────────────────────────────────────────────

function detailsTable(event: EmailEvent): string {
  const lecturerNames = (event.lecturers ?? []).map(formatLecturerName).join(', ') || '—'

  const studyProgramNames =
    (event.studyPrograms ?? [])
      .map((sp) => sp.studyProgram?.name ?? '')
      .filter(Boolean)
      .join(', ') || '—'

  const rows: [string, string][] = [
    ['Veranstaltungstyp', EVENT_TYPE_LABELS[event.eventType] ?? event.eventType],
    ['Institution', INSTITUTION_LABELS[event.institution] ?? event.institution],
    ['Beginn', formatTime(event.timeStart)],
    ['Ende', formatTime(event.timeEnd)],
    ['Ort', formatLocation(event)],
    [
      'Meldende Person',
      event.melder
        ? `${safe([event.melder.firstName, event.melder.lastName].filter(Boolean).join(' '))} (${safe(event.melder.email)})`
        : '—',
    ],
    ['Vortragende', lecturerNames],
    ['Studiengänge', studyProgramNames],
  ]

  const rowsHtml = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:6px 12px;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:6px 12px;color:#333;vertical-align:top;">${value}</td>
      </tr>`
    )
    .join('')

  return `
  <table style="border-collapse:collapse;width:100%;margin-top:16px;">
    <tbody>${rowsHtml}
    </tbody>
  </table>`
}

function emailWrapper(headerColor: string, title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:6px;overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:${headerColor};padding:24px 28px;">
              <h1 style="margin:0;font-size:20px;color:#fff;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px 28px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f0f0f0;padding:12px 28px;font-size:12px;color:#888;text-align:center;">
              HIT-Verwaltungssystem &middot; <a href="${adminUrl('/admin')}" style="color:#888;">${adminUrl('/admin')}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Generate a notification email for a newly submitted event. */
export function generateNewEventEmail(event: EmailEvent): EmailContent {
  const subject = `HIT — Neue Veranstaltung: ${event.title}`

  const body = `
    <p style="margin:0 0 8px;font-size:15px;color:#333;">
      Eine neue Veranstaltung wurde eingereicht:
    </p>
    <h2 style="margin:0 0 16px;font-size:18px;color:#333;">${escapeHtml(event.title)}</h2>
    ${detailsTable(event)}
    <p style="margin:20px 0 0;font-size:13px;color:#888;">
      <a href="${adminUrl('/admin/events/' + event.id)}" style="color:#AC0634;">
        Im Admin-Bereich öffnen
      </a>
    </p>`

  const html = emailWrapper('#AC0634', 'Neue Veranstaltung eingereicht', body)

  return { subject, html }
}

/** Generate a notification email for an edited event with highlighted changes. */
export function generateEditEventEmail(event: EmailEvent, changes: Change[]): EmailContent {
  const subject = `HIT — Veranstaltung bearbeitet: ${event.title}`

  const changesHtml =
    changes.length === 0
      ? '<p style="margin:4px 0;color:#666;font-size:13px;">Keine Details verfügbar.</p>'
      : changes
          .map((c) => {
            const oldStr = formatChangeValue(c.field, c.oldValue)
            const newStr = formatChangeValue(c.field, c.newValue)
            const fieldLabel = FIELD_LABELS[c.field] ?? c.field
            return `
          <div style="margin-bottom:8px;">
            <span style="font-weight:600;color:#555;">${escapeHtml(fieldLabel)}:</span><br>
            <span style="text-decoration:line-through;color:#999;">${safe(oldStr)}</span>
            &nbsp;&rarr;&nbsp;
            <span style="color:#2a7a2a;font-weight:600;">${safe(newStr)}</span>
          </div>`
          })
          .join('')

  const changeSummaryBox = `
    <div style="background:#FFFBCC;border:1px solid #F5D000;border-radius:4px;padding:16px;margin-bottom:20px;">
      <h3 style="margin:0 0 12px;font-size:15px;color:#333;">Was hat sich geändert</h3>
      ${changesHtml}
    </div>`

  const body = `
    <p style="margin:0 0 8px;font-size:15px;color:#333;">
      Eine Veranstaltung wurde bearbeitet:
    </p>
    <h2 style="margin:0 0 16px;font-size:18px;color:#333;">${escapeHtml(event.title)}</h2>
    ${changeSummaryBox}
    ${detailsTable(event)}
    <p style="margin:20px 0 0;font-size:13px;color:#888;">
      <a href="${adminUrl('/admin/events/' + event.id)}" style="color:#009EE3;">
        Im Admin-Bereich öffnen
      </a>
    </p>`

  const html = emailWrapper('#009EE3', 'Veranstaltung bearbeitet', body)

  return { subject, html }
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Titel',
  description: 'Beschreibung',
  eventType: 'Veranstaltungstyp',
  institution: 'Institution',
  timeStart: 'Beginn',
  timeEnd: 'Ende',
  building: 'Gebäude',
  room: 'Raum',
  lecturers: 'Vortragende',
  studyPrograms: 'Studiengänge',
}

function formatChangeValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (field === 'timeStart' || field === 'timeEnd') {
    if (value instanceof Date) return formatEventDateTime(value)
    return String(value)
  }
  if (field === 'eventType' && typeof value === 'string') {
    return EVENT_TYPE_LABELS[value] ?? value
  }
  if (field === 'institution' && typeof value === 'string') {
    return INSTITUTION_LABELS[value] ?? value
  }
  if (field === 'building' && typeof value === 'object') {
    return (value as Building).name ?? '—'
  }
  if (field === 'room' && typeof value === 'object') {
    return (value as Room).name ?? '—'
  }
  if (field === 'lecturers' && Array.isArray(value)) {
    return (value as Lecturer[]).map(formatLecturerName).join(', ') || '—'
  }
  if (field === 'studyPrograms' && Array.isArray(value)) {
    return (
      (value as { studyProgramId: string; studyProgram: StudyProgram }[])
        .map((sp) => sp.studyProgram?.name ?? '')
        .filter(Boolean)
        .join(', ') || '—'
    )
  }
  return String(value)
}

/** Compare two events field-by-field and return the list of changes. */
export function detectChanges(oldEvent: EmailEvent, newEvent: EmailEvent): Change[] {
  const changes: Change[] = []

  // Simple string/enum fields
  const stringFields: (keyof EmailEvent & string)[] = [
    'title',
    'description',
    'eventType',
    'institution',
  ]
  for (const field of stringFields) {
    if (oldEvent[field] !== newEvent[field]) {
      changes.push({ field, oldValue: oldEvent[field], newValue: newEvent[field] })
    }
  }

  // Date fields — compare by timestamp
  const dateFields: (keyof EmailEvent & string)[] = ['timeStart', 'timeEnd']
  for (const field of dateFields) {
    const oldVal = oldEvent[field] as Date | undefined
    const newVal = newEvent[field] as Date | undefined
    const oldMs = oldVal instanceof Date ? oldVal.getTime() : undefined
    const newMs = newVal instanceof Date ? newVal.getTime() : undefined
    if (oldMs !== newMs) {
      changes.push({ field, oldValue: oldVal, newValue: newVal })
    }
  }

  // Building: compare by id
  const oldBuildingId = oldEvent.building?.id ?? oldEvent.buildingId ?? null
  const newBuildingId = newEvent.building?.id ?? newEvent.buildingId ?? null
  if (oldBuildingId !== newBuildingId) {
    changes.push({ field: 'building', oldValue: oldEvent.building, newValue: newEvent.building })
  }

  // Room: compare by id
  const oldRoomId = oldEvent.room?.id ?? oldEvent.roomId ?? null
  const newRoomId = newEvent.room?.id ?? newEvent.roomId ?? null
  if (oldRoomId !== newRoomId) {
    changes.push({ field: 'room', oldValue: oldEvent.room, newValue: newEvent.room })
  }

  // Lecturers: compare sorted id lists
  const oldLecturerIds = (oldEvent.lecturers ?? [])
    .map((l) => l.id)
    .sort()
    .join(',')
  const newLecturerIds = (newEvent.lecturers ?? [])
    .map((l) => l.id)
    .sort()
    .join(',')
  if (oldLecturerIds !== newLecturerIds) {
    changes.push({
      field: 'lecturers',
      oldValue: oldEvent.lecturers,
      newValue: newEvent.lecturers,
    })
  }

  // Study programs: compare sorted id lists
  const oldSpIds = (oldEvent.studyPrograms ?? [])
    .map((sp) => sp.studyProgramId)
    .sort()
    .join(',')
  const newSpIds = (newEvent.studyPrograms ?? [])
    .map((sp) => sp.studyProgramId)
    .sort()
    .join(',')
  if (oldSpIds !== newSpIds) {
    changes.push({
      field: 'studyPrograms',
      oldValue: oldEvent.studyPrograms,
      newValue: newEvent.studyPrograms,
    })
  }

  return changes
}
