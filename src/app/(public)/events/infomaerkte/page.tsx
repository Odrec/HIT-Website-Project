import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'
import { EventCard } from '@/components/events/EventCard'
import { getActiveEdition } from '@/lib/active-edition'

export const dynamic = 'force-dynamic'

// Display order for the three known markets. Anything not in this list is
// appended after, alphabetically. Match is case-insensitive substring on
// the market name to tolerate small wording changes ("Infomarkt Schloss"
// vs "Schloss Infomarkt").
const MARKET_ORDER = ['schloss', 'sl', 'caprivi'] as const

function marketSortKey(name: string): number {
  const lower = name.toLowerCase()
  const idx = MARKET_ORDER.findIndex((token) => lower.includes(token))
  return idx === -1 ? MARKET_ORDER.length : idx
}

function anchorId(marketId: string): string {
  return `markt-${marketId}`
}

export default async function InfomaerktePage() {
  const edition = await getActiveEdition()

  const markets = await prisma.informationMarket.findMany({
    include: {
      events: {
        where: {
          event: { editionId: edition.id, reviewStatus: 'PUBLISHED' },
        },
        include: {
          event: {
            include: {
              building: { select: { id: true, name: true, address: true } },
              room: { select: { id: true, name: true } },
              lecturers: {
                select: { id: true, firstName: true, lastName: true, title: true },
              },
              studyPrograms: {
                include: {
                  studyProgram: {
                    select: {
                      id: true,
                      name: true,
                      institution: true,
                      clusters: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const sortedMarkets = markets
    .map((m) => ({
      id: m.id,
      name: m.name,
      location: m.location,
      events: m.events
        .map((eim) => eim.event)
        .filter((e) => e.timeStart !== null)
        .sort((a, b) => (a.timeStart?.getTime() ?? 0) - (b.timeStart?.getTime() ?? 0)),
    }))
    .sort((a, b) => marketSortKey(a.name) - marketSortKey(b.name))

  const reshape = (e: (typeof sortedMarkets)[number]['events'][number]) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    eventType: e.eventType,
    timeStart: e.timeStart?.toISOString() ?? '',
    timeEnd: e.timeEnd?.toISOString() ?? null,
    institution: e.institution,
    meetingPoint: e.meetingPoint,
    photoUrl: e.photoUrl,
    locationHint: e.locationHint,
    isCrossProgram: e.isCrossProgram,
    building: e.building ? { id: e.building.id, name: e.building.name } : null,
    room: e.room ? { id: e.room.id, name: e.room.name } : null,
    lecturers: e.lecturers,
    studyPrograms: e.studyPrograms.map((sp) => ({
      id: sp.studyProgram.id,
      name: sp.studyProgram.name,
      institution: sp.studyProgram.institution,
      clusters: sp.studyProgram.clusters,
    })),
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-1 text-sm text-hit-gray-500 hover:text-hit-uni-500"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück zur Übersicht
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-hit-gray-900">Infomärkte</h1>
        <p className="mt-2 max-w-2xl text-hit-gray-600">
          An den Infomärkten beraten Studierende und Mitarbeitende der Universität und Hochschule
          rund um die Studienorientierung. Hier können Sie ohne Anmeldung jederzeit vorbeischauen,
          Fragen stellen und sich Materialien mitnehmen.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-hit-gray-500">
          Standorte
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {sortedMarkets.map((m) => (
            <a
              key={m.id}
              href={`#${anchorId(m.id)}`}
              className="flex items-center gap-3 rounded-md border border-hit-gray-200 border-l-4 border-l-hit-gray-400 bg-hit-gray-50 px-4 py-3 text-sm text-hit-gray-900 transition-colors hover:bg-hit-gray-100"
            >
              <MapPin className="h-4 w-4 text-hit-gray-500" />
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-hit-gray-500">{m.location}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {sortedMarkets.map((m) => (
        <section key={m.id} id={anchorId(m.id)} className="mb-10 scroll-mt-20">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-hit-uni-500" />
            <h2 className="text-xl font-semibold text-hit-gray-900">{m.name}</h2>
            <span className="text-sm text-hit-gray-500">· {m.location}</span>
          </div>
          {m.events.length === 0 ? (
            <p className="text-hit-gray-500">
              Noch keine Infomarkt-Veranstaltungen an diesem Standort.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {m.events.map((e) => (
                <EventCard key={e.id} event={reshape(e) as never} viewMode="list" />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
