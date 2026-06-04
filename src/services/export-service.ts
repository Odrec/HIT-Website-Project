// Export Data Service - Fetches and formats data for Excel/PDF export views

import { prisma } from '@/lib/db/prisma'
import type { EventType, Institution, Affiliation } from '@/generated/prisma/client/enums'
import { formatEventTime } from '@/lib/event-time'
import { getActiveEditionId } from '@/lib/active-edition'

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
  fakultaet: string
  fachbereich: string
  raum: string
  anzahlVeranstaltungen: number
}

export interface LecturerRow {
  name: string
  titel: string
  email: string
  institution: string
  veranstaltung: string
  gebaeude: string
  raum: string
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
    .sort()
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
    const editionId = await getActiveEditionId()
    const events = await prisma.event.findMany({
      where: { editionId, reviewStatus: 'PUBLISHED' },
      include: eventInclude,
      orderBy: { timeStart: 'asc' },
    })
    return events.map(eventToRow)
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
      result[key].sort((a, b) => a.titel.localeCompare(b.titel, 'de'))
    }

    // Return sorted by key
    const sorted: Record<string, EventRow[]> = {}
    for (const key of Object.keys(result).sort((a, b) => a.localeCompare(b, 'de'))) {
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
      result[key].sort((a, b) => a.titel.localeCompare(b.titel, 'de'))
    }

    const sorted: Record<string, EventRow[]> = {}
    for (const key of Object.keys(result).sort((a, b) => a.localeCompare(b, 'de'))) {
      sorted[key] = result[key]
    }
    return sorted
  },

  /**
   * Events grouped by building then room.
   * "Ohne Gebäude"/"Ohne Raum" for missing values.
   */
  async eventsByRoom(): Promise<Record<string, Record<string, EventRow[]>>> {
    const events = await fetchAllEvents()
    const result: Record<string, Record<string, EventRow[]>> = {}

    for (const event of events) {
      const buildingName = event.building?.name ?? event.room?.building?.name ?? 'Ohne Gebäude'
      const roomName = event.room?.name ?? 'Ohne Raum'
      const row = eventToRow(event)

      if (!result[buildingName]) result[buildingName] = {}
      if (!result[buildingName][roomName]) result[buildingName][roomName] = []
      result[buildingName][roomName].push(row)
    }

    // Sort within each room group
    for (const building of Object.keys(result)) {
      for (const room of Object.keys(result[building])) {
        result[building][room].sort((a, b) => a.titel.localeCompare(b.titel, 'de'))
      }
    }

    // Sort by building key, then by room key
    const sorted: Record<string, Record<string, EventRow[]>> = {}
    for (const bKey of Object.keys(result).sort((a, b) => a.localeCompare(b, 'de'))) {
      sorted[bKey] = {}
      for (const rKey of Object.keys(result[bKey]).sort((a, b) => a.localeCompare(b, 'de'))) {
        sorted[bKey][rKey] = result[bKey][rKey]
      }
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
      fakultaet: m.fakultaet ?? '',
      fachbereich: m.fachbereich ?? '',
      raum: m.room ?? '',
      anzahlVeranstaltungen: m._count.events,
    }))
  },

  /**
   * All Lecturer records with their event's building/room.
   */
  async lecturers(): Promise<LecturerRow[]> {
    const editionId = await getActiveEditionId()
    const lecturers = await prisma.lecturer.findMany({
      where: { event: { editionId, reviewStatus: 'PUBLISHED' } },
      include: {
        event: {
          include: {
            building: true,
            room: { include: { building: true } },
          },
        },
      },
      orderBy: { lastName: 'asc' },
    })

    return lecturers.map((l) => ({
      name: [l.firstName, l.lastName].filter(Boolean).join(' '),
      titel: l.title ?? '',
      email: l.email ?? '',
      institution: l.affiliation ? formatInstitution(l.affiliation) : '',
      veranstaltung: l.event.title,
      gebaeude: l.event.building?.name ?? l.event.room?.building?.name ?? '',
      raum: l.event.room?.name ?? '',
    }))
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
        .sort()
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

    const crossProgram: typeof events = []
    const clustered: Record<string, { events: typeof events }> = {}

    for (const event of events) {
      if (event.isCrossProgram) {
        crossProgram.push(event)
        continue
      }

      const clusterNames = new Set<string>()
      for (const esp of event.studyPrograms) {
        for (const cluster of esp.studyProgram.clusters) {
          clusterNames.add(cluster.name)
        }
      }
      if (clusterNames.size === 0) {
        clusterNames.add('Ohne Studienfeld')
      }

      for (const name of clusterNames) {
        if (!clustered[name]) clustered[name] = { events: [] }
        clustered[name].events.push(event)
      }
    }

    // Sort within clusters
    for (const key of Object.keys(clustered)) {
      clustered[key].events.sort((a, b) => a.title.localeCompare(b.title, 'de'))
    }

    // Sort cluster keys
    const sortedClustered: Record<string, { events: typeof events }> = {}
    for (const key of Object.keys(clustered).sort((a, b) => a.localeCompare(b, 'de'))) {
      sortedClustered[key] = clustered[key]
    }

    return {
      clustered: sortedClustered,
      crossProgram,
      infoMarkets,
    }
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
    return prisma.building.findMany({
      include: { rooms: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    })
  },
}

export default exportService
