// Export Data Service - Fetches and formats data for Excel/PDF export views

import { prisma } from '@/lib/db/prisma'
import type { EventType, Institution, Affiliation } from '@/generated/prisma/client/enums'
import { formatEventTime } from '@/lib/event-time'
import { getActiveEditionId } from '@/lib/active-edition'
import { compareDe } from '@/lib/sort-de'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Flat row used by most event export views */
export interface EventRow {
  titel: string
  typ: string
  institution: string
  studiengaenge: string
  uhrzeit: string
  gebaeude: string
  raum: string
  dozent: string
  beschreibung: string
}

export interface MelderRow {
  vorname: string
  nachname: string
  titel: string
  email: string
  telefon: string
  institution: string
  organisationseinheit: string
  raum: string
  adresse: string
  anzahlVeranstaltungen: number
}

export interface LecturerRow {
  name: string
  titel: string
  email: string
  institution: string
  studiengaenge: string
  studienfeld: string
  organisationseinheit: string
  raum: string
  anzahlVeranstaltungen: number
}

/** One row per (Studiengang × Veranstaltung) pair, used by the Studiengang export. */
export interface StudyProgramEventRow extends EventRow {
  studiengang: string
  studienfeld: string
}

export interface InfomarktRow {
  infomarkt: string
  standort: string
  veranstaltung: string
  institution: string
  studiengaenge: string
  dozent: string
}

// Type for event with all relations included
type EventWithRelations = Awaited<ReturnType<typeof fetchAllEvents>>[number]

// ---------------------------------------------------------------------------
// Shared include object for event queries
// ---------------------------------------------------------------------------

const eventInclude = {
  lecturers: true,
  melder: true,
  building: true,
  room: { include: { building: true } },
  studyPrograms: {
    include: {
      studyProgram: {
        include: {
          clusters: true,
        },
      },
    },
  },
  infoMarkets: {
    include: {
      market: true,
    },
  },
} as const

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function formatStudyPrograms(event: EventWithRelations): string {
  return event.studyPrograms
    .map((esp) => esp.studyProgram.name)
    .sort(compareDe)
    .join(', ')
}

function formatLecturers(event: EventWithRelations): string {
  return event.lecturers
    .map((l) => [l.title, l.firstName, l.lastName].filter(Boolean).join(' '))
    .join(', ')
}

function formatTimeRange(event: EventWithRelations): string {
  if (!event.timeStart) return ''
  const start = formatEventTime(event.timeStart)
  if (!event.timeEnd) return start
  return `${start} – ${formatEventTime(event.timeEnd)}`
}

function formatInstitution(institution: Institution | Affiliation): string {
  switch (institution) {
    case 'UNI':
      return 'Universität'
    case 'HOCHSCHULE':
      return 'Hochschule'
    case 'BOTH':
      return 'Hochschulübergreifend'
    case 'BEIDE':
      return 'Beide'
    case 'EXTERN':
      return 'Extern'
    default:
      return String(institution)
  }
}

function formatEventType(type: EventType): string {
  const map: Record<EventType, string> = {
    VORTRAG: 'Vortrag',
    LABORFUEHRUNG: 'Laborführung',
    RUNDGANG: 'Rundgang',
    WORKSHOP: 'Workshop',
    ONLINE: 'Online',
    VIDEO: 'Video',
    INFOSTAND: 'Infostand',
    SCHNUPPER: 'Schnupperveranstaltung',
    INTERAKTION: 'Interaktion',
    SONSTIGES: 'Sonstiges',
  }
  return map[type] ?? String(type)
}

function eventToRow(event: EventWithRelations): EventRow {
  return {
    titel: event.title,
    typ: formatEventType(event.eventType),
    institution: formatInstitution(event.institution),
    studiengaenge: formatStudyPrograms(event),
    uhrzeit: formatTimeRange(event),
    gebaeude: event.building?.name ?? event.room?.building?.name ?? '',
    raum: event.room?.name ?? '',
    dozent: formatLecturers(event),
    beschreibung: event.description ?? '',
  }
}

// ---------------------------------------------------------------------------
// Pure ordering / grouping helpers (exported for unit testing)
// ---------------------------------------------------------------------------

type SortableEvent = {
  timeStart: Date | string | null
  studyPrograms: { studyProgram: { name: string; clusters: { name: string }[] } }[]
}

function timeValue(t: Date | string | null): number {
  if (!t) return Number.POSITIVE_INFINITY
  const ms = new Date(t).getTime()
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms
}

/** Alphabetically-first Studienfeld (cluster) name across the event's programs. */
export function firstClusterName(e: SortableEvent): string {
  const names = e.studyPrograms
    .flatMap((sp) => sp.studyProgram.clusters.map((c) => c.name))
    .sort(compareDe)
  return names[0] ?? ''
}

/** Alphabetically-first Studiengang (program) name for the event. */
export function firstProgramName(e: SortableEvent): string {
  const names = e.studyPrograms.map((sp) => sp.studyProgram.name).sort(compareDe)
  return names[0] ?? ''
}

/** Sort comparator: time asc (nulls last), then Studienfeld, then Studiengang. */
export function compareByTimeClusterProgram(a: SortableEvent, b: SortableEvent): number {
  const ta = timeValue(a.timeStart)
  const tb = timeValue(b.timeStart)
  if (ta !== tb) return ta - tb
  const ca = firstClusterName(a)
  const cb = firstClusterName(b)
  if (ca !== cb) return compareDe(ca, cb)
  return compareDe(firstProgramName(a), firstProgramName(b))
}

type RoomSortableEvent = SortableEvent & {
  building?: { name: string } | null
  room?: { name: string; building?: { name: string } | null } | null
}

export function eventBuildingName(e: RoomSortableEvent): string {
  return e.building?.name ?? e.room?.building?.name ?? ''
}

/** Sort comparator: building name, then room name, then time. */
export function compareByBuildingRoomTime(a: RoomSortableEvent, b: RoomSortableEvent): number {
  const ba = eventBuildingName(a)
  const bb = eventBuildingName(b)
  if (ba !== bb) return compareDe(ba, bb)
  const ra = a.room?.name ?? ''
  const rb = b.room?.name ?? ''
  if (ra !== rb) return compareDe(ra, rb)
  return compareByTimeClusterProgram(a, b)
}

type BookletClusterInfo = { name: string; institution: Institution; sortOrder: number }

type BookletEventShape = {
  isCrossProgram: boolean
  timeStart: Date | string | null
  studyPrograms: { studyProgram: { clusters: BookletClusterInfo[] } }[]
}

export interface BookletClusterGroup<T> {
  name: string
  institution: Institution
  sortOrder: number
  events: T[]
}

// Deliberately HOCHSCHULE-first — a booklet layout choice, distinct from
// INSTITUTION_RANK in study-program-service.ts (UNI-first, reproducing the
// Postgres enum declaration order). Do not "harmonise" the two.
const BOOKLET_INSTITUTION_RANK: Record<string, number> = { HOCHSCHULE: 0, UNI: 1, BOTH: 2 }

/**
 * Split events for the booklet into crossProgram (Rund ums Studium) and cluster
 * groups. Cluster groups are ordered by institution (Hochschule → Universität →
 * BOTH), then cluster.sortOrder, then name. Events within each group are
 * time-sorted (earlier first, no-time last). An event in multiple clusters
 * appears in each group; a non-cross event with no cluster goes to "Ohne
 * Studienfeld" (ranked last).
 */
export function groupEventsForBooklet<T extends BookletEventShape>(
  events: T[]
): { crossProgram: T[]; clusterGroups: BookletClusterGroup<T>[] } {
  const byTime = (a: T, b: T) => timeValue(a.timeStart) - timeValue(b.timeStart)

  const crossProgram = events.filter((e) => e.isCrossProgram).sort(byTime)

  const groups = new Map<string, BookletClusterGroup<T>>()
  const NO_FIELD = 'Ohne Studienfeld'

  for (const event of events) {
    if (event.isCrossProgram) continue

    const infos: BookletClusterInfo[] = []
    for (const sp of event.studyPrograms) {
      for (const c of sp.studyProgram.clusters) infos.push(c)
    }

    if (infos.length === 0) {
      const g =
        groups.get(NO_FIELD) ??
        (groups
          .set(NO_FIELD, {
            name: NO_FIELD,
            institution: 'UNI' as Institution,
            sortOrder: Number.MAX_SAFE_INTEGER,
            events: [],
          })
          .get(NO_FIELD) as BookletClusterGroup<T>)
      g.events.push(event)
      continue
    }

    const seen = new Set<string>()
    for (const info of infos) {
      if (seen.has(info.name)) continue
      seen.add(info.name)
      const g =
        groups.get(info.name) ??
        (groups
          .set(info.name, {
            name: info.name,
            institution: info.institution,
            sortOrder: info.sortOrder,
            events: [],
          })
          .get(info.name) as BookletClusterGroup<T>)
      g.events.push(event)
    }
  }

  const clusterGroups = Array.from(groups.values())
  for (const g of clusterGroups) g.events.sort(byTime)
  clusterGroups.sort((a, b) => {
    const ra = BOOKLET_INSTITUTION_RANK[a.institution] ?? 9
    const rb = BOOKLET_INSTITUTION_RANK[b.institution] ?? 9
    if (ra !== rb) return ra - rb
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return compareDe(a.name, b.name)
  })

  return { crossProgram, clusterGroups }
}

/**
 * Group flat Studiengang rows by their programme name, keys ordered in German.
 * Row order inside a group is preserved from the already-sorted input.
 */
export function groupFlatRowsByProgram(
  rows: StudyProgramEventRow[]
): Record<string, StudyProgramEventRow[]> {
  const result: Record<string, StudyProgramEventRow[]> = {}
  for (const r of rows) {
    ;(result[r.studiengang] ??= []).push(r)
  }
  const sorted: Record<string, StudyProgramEventRow[]> = {}
  for (const key of Object.keys(result).sort(compareDe)) {
    sorted[key] = result[key]
  }
  return sorted
}

type LecturerRecord = {
  firstName: string
  lastName: string
  title: string | null
  email: string | null
  affiliation: Affiliation | null
  event: {
    id: string
    melder: { organisationseinheit: string | null } | null
    room: { name: string } | null
    building: { name: string } | null
    studyPrograms: { studyProgram: { name: string; clusters: { name: string }[] } }[]
  }
}

/** Dedupe lecturer-per-event records into one row per person (email, else name+title). */
export function aggregateLecturers(records: LecturerRecord[]): LecturerRow[] {
  type Acc = {
    firstName: string
    lastName: string
    title: string | null
    email: string | null
    affiliation: Affiliation | null
    programs: Set<string>
    clusters: Set<string>
    rooms: Set<string>
    eventIds: Set<string>
    organisationseinheit: string
  }
  const byPerson = new Map<string, Acc>()

  for (const r of records) {
    const key = r.email
      ? `email:${r.email.toLowerCase()}`
      : `name:${r.firstName}|${r.lastName}|${r.title ?? ''}`
    let acc = byPerson.get(key)
    if (!acc) {
      acc = {
        firstName: r.firstName,
        lastName: r.lastName,
        title: r.title,
        email: r.email,
        affiliation: r.affiliation,
        programs: new Set(),
        clusters: new Set(),
        rooms: new Set(),
        eventIds: new Set(),
        organisationseinheit: '',
      }
      byPerson.set(key, acc)
    }
    acc.eventIds.add(r.event.id)
    if (!acc.organisationseinheit && r.event.melder?.organisationseinheit) {
      acc.organisationseinheit = r.event.melder.organisationseinheit
    }
    const roomName = r.event.room?.name
    if (roomName) acc.rooms.add(roomName)
    for (const sp of r.event.studyPrograms) {
      acc.programs.add(sp.studyProgram.name)
      for (const c of sp.studyProgram.clusters) acc.clusters.add(c.name)
    }
  }

  const join = (s: Set<string>) => Array.from(s).sort(compareDe).join(', ')

  return Array.from(byPerson.values())
    .map((acc) => ({
      name: [acc.firstName, acc.lastName].filter(Boolean).join(' '),
      titel: acc.title ?? '',
      email: acc.email ?? '',
      institution: acc.affiliation ? formatInstitution(acc.affiliation) : '',
      studiengaenge: join(acc.programs),
      studienfeld: join(acc.clusters),
      organisationseinheit: acc.organisationseinheit,
      raum: join(acc.rooms),
      anzahlVeranstaltungen: acc.eventIds.size,
    }))
    .sort((a, b) => compareDe(a.name, b.name))
}

// ---------------------------------------------------------------------------
// Shared data fetching
// ---------------------------------------------------------------------------

async function fetchAllEvents() {
  const editionId = await getActiveEditionId()
  return prisma.event.findMany({
    where: { editionId, reviewStatus: 'PUBLISHED' },
    include: eventInclude,
  })
}

// ---------------------------------------------------------------------------
// Exported service
// ---------------------------------------------------------------------------

export const exportService = {
  /**
   * All events sorted A-Z by title, returned as flat rows.
   */
  async eventsAZ(): Promise<EventRow[]> {
    const editionId = await getActiveEditionId()
    const events = await prisma.event.findMany({
      where: { editionId, reviewStatus: 'PUBLISHED' },
      include: eventInclude,
      orderBy: { title: 'asc' },
    })
    return events.map(eventToRow)
  },

  /**
   * All events sorted by timeStart, returned as flat rows.
   */
  async eventsByTime(): Promise<EventRow[]> {
    const events = await fetchAllEvents()
    return [...events].sort(compareByTimeClusterProgram).map(eventToRow)
  },

  /**
   * All events as flat rows, sorted by building, then room, then time.
   */
  async eventsByRoomFlat(): Promise<EventRow[]> {
    const events = await fetchAllEvents()
    return [...events].sort(compareByBuildingRoomTime).map(eventToRow)
  },

  /**
   * Flat Studiengang view: one row per (Studiengang × Veranstaltung) pair,
   * carrying the programme's Studienfeld(er). An event linked to N programmes
   * yields N rows; events without a programme land under "Ohne Studiengang".
   *
   * Feeds both the "Gesamtliste" sheet and the per-programme sheets, so the two
   * can never disagree.
   */
  async eventsByStudyProgramFlat(): Promise<StudyProgramEventRow[]> {
    const events = await fetchAllEvents()
    const rows: StudyProgramEventRow[] = []

    for (const event of events) {
      const base = eventToRow(event)

      if (event.studyPrograms.length === 0) {
        rows.push({ ...base, studiengang: 'Ohne Studiengang', studienfeld: '' })
        continue
      }

      for (const esp of event.studyPrograms) {
        rows.push({
          ...base,
          studiengang: esp.studyProgram.name,
          studienfeld: esp.studyProgram.clusters
            .map((c) => c.name)
            .sort(compareDe)
            .join(', '),
        })
      }
    }

    rows.sort(
      (a, b) =>
        compareDe(a.studiengang, b.studiengang) ||
        // uhrzeit is "HH:MM – HH:MM"; a plain lexicographic compare is already
        // chronological. compareDe is deliberately not used here because its
        // numeric:true option would reorder the digits and break the time sort.
        a.uhrzeit.localeCompare(b.uhrzeit) ||
        compareDe(a.titel, b.titel)
    )
    return rows
  },

  /**
   * Events grouped by study-program cluster name.
   * Events in multiple clusters appear in each. "Ohne Studienfeld" for unclustered.
   */
  async eventsByCluster(): Promise<Record<string, EventRow[]>> {
    const events = await fetchAllEvents()
    const result: Record<string, EventRow[]> = {}

    for (const event of events) {
      const clusterNames = new Set<string>()

      for (const esp of event.studyPrograms) {
        for (const cluster of esp.studyProgram.clusters) {
          clusterNames.add(cluster.name)
        }
      }

      if (clusterNames.size === 0) {
        clusterNames.add('Ohne Studienfeld')
      }

      const row = eventToRow(event)
      for (const name of clusterNames) {
        if (!result[name]) result[name] = []
        result[name].push(row)
      }
    }

    // Sort within each cluster
    for (const key of Object.keys(result)) {
      result[key].sort((a, b) => compareDe(a.titel, b.titel))
    }

    // Return sorted by key
    const sorted: Record<string, EventRow[]> = {}
    for (const key of Object.keys(result).sort(compareDe)) {
      sorted[key] = result[key]
    }
    return sorted
  },

  /**
   * Events grouped by building name. "Ohne Gebäude" for events without one.
   */
  async eventsByBuilding(): Promise<Record<string, EventRow[]>> {
    const events = await fetchAllEvents()
    const result: Record<string, EventRow[]> = {}

    for (const event of events) {
      const buildingName = event.building?.name ?? event.room?.building?.name ?? 'Ohne Gebäude'
      const row = eventToRow(event)
      if (!result[buildingName]) result[buildingName] = []
      result[buildingName].push(row)
    }

    for (const key of Object.keys(result)) {
      result[key].sort((a, b) => compareDe(a.titel, b.titel))
    }

    const sorted: Record<string, EventRow[]> = {}
    for (const key of Object.keys(result).sort(compareDe)) {
      sorted[key] = result[key]
    }
    return sorted
  },

  /**
   * All Melder records with event count.
   */
  async melders(): Promise<MelderRow[]> {
    const editionId = await getActiveEditionId()
    const melders = await prisma.melder.findMany({
      include: {
        _count: {
          select: { events: { where: { editionId, reviewStatus: 'PUBLISHED' } } },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    return melders.map((m) => ({
      vorname: m.firstName,
      nachname: m.lastName,
      titel: m.title ?? '',
      email: m.email,
      telefon: m.phone ?? '',
      institution: formatInstitution(m.affiliation),
      organisationseinheit: m.organisationseinheit ?? '',
      raum: m.room ?? '',
      adresse: m.adresse ?? '',
      anzahlVeranstaltungen: m._count.events,
    }))
  },

  /**
   * All Lecturer records aggregated per person with org-unit from Melder.
   */
  async lecturers(): Promise<LecturerRow[]> {
    const editionId = await getActiveEditionId()
    const records = await prisma.lecturer.findMany({
      where: { event: { editionId, reviewStatus: 'PUBLISHED' } },
      include: {
        event: {
          include: {
            melder: true,
            building: true,
            room: { include: { building: true } },
            studyPrograms: { include: { studyProgram: { include: { clusters: true } } } },
          },
        },
      },
      orderBy: { lastName: 'asc' },
    })
    return aggregateLecturers(records)
  },

  /**
   * All EventInformationMarket records with event + market details.
   */
  async infomaerkte(): Promise<InfomarktRow[]> {
    const editionId = await getActiveEditionId()
    const records = await prisma.eventInformationMarket.findMany({
      where: { event: { editionId, reviewStatus: 'PUBLISHED' } },
      include: {
        market: true,
        event: {
          include: {
            lecturers: true,
            studyPrograms: {
              include: { studyProgram: true },
            },
          },
        },
      },
      orderBy: { market: { name: 'asc' } },
    })

    return records.map((r) => ({
      infomarkt: r.market.name,
      standort: r.market.location,
      veranstaltung: r.event.title,
      institution: formatInstitution(r.event.institution),
      studiengaenge: r.event.studyPrograms
        .map((esp) => esp.studyProgram.name)
        .sort(compareDe)
        .join(', '),
      dozent: r.event.lecturers
        .map((l) => [l.title, l.firstName, l.lastName].filter(Boolean).join(' '))
        .join(', '),
    }))
  },

  /**
   * Full event objects for booklet PDF generation.
   * Cross-program events separated out. Info markets included.
   */
  async eventsForBooklet() {
    const editionId = await getActiveEditionId()
    const [events, infoMarkets] = await Promise.all([
      prisma.event.findMany({
        where: { editionId, reviewStatus: 'PUBLISHED' },
        include: eventInclude,
        orderBy: { title: 'asc' },
      }),
      prisma.informationMarket.findMany({
        include: { events: { include: { event: true } } },
        orderBy: { name: 'asc' },
      }),
    ])

    // Postgres runs a C collation, so order in German here.
    infoMarkets.sort((a, b) => compareDe(a.name, b.name))

    const { crossProgram, clusterGroups } = groupEventsForBooklet(events)
    return { crossProgram, clusterGroups, infoMarkets }
  },

  /**
   * Events for a given institution (including BOTH), with relations, sorted by time then title.
   */
  async eventsForRoomAssignment(institution: 'UNI' | 'HOCHSCHULE') {
    const editionId = await getActiveEditionId()
    return prisma.event.findMany({
      where: {
        institution: { in: [institution, 'BOTH'] },
        editionId,
        reviewStatus: 'PUBLISHED',
      },
      include: {
        building: true,
        room: { include: { building: true } },
        studyPrograms: {
          include: { studyProgram: true },
        },
      },
      orderBy: [{ timeStart: 'asc' }, { title: 'asc' }],
    })
  },

  /**
   * All buildings with their rooms, for dropdown population.
   */
  async buildingsWithRooms() {
    const buildings = await prisma.building.findMany({
      include: { rooms: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    })

    // Postgres runs a C collation, so order in German here.
    buildings.sort((a, b) => compareDe(a.name, b.name))
    for (const building of buildings) {
      building.rooms.sort((a, b) => compareDe(a.name, b.name))
    }

    return buildings
  },
}

export default exportService
