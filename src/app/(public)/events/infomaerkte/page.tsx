import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'
import { EventCard } from '@/components/events/EventCard'
import { getActiveEdition } from '@/lib/active-edition'

export default async function InfomaerktePage() {
  const edition = await getActiveEdition()
  const eventsByLocation = await prisma.event.findMany({
    where: {
      editionId: edition.id,
      reviewStatus: 'PUBLISHED',
      OR: [{ locationType: 'INFOMARKT_SCHLOSS' }, { locationType: 'INFOMARKT_CN' }],
    },
    orderBy: { timeStart: 'asc' },
    include: {
      building: { select: { id: true, name: true, address: true } },
      room: { select: { id: true, name: true } },
      lecturers: { select: { id: true, firstName: true, lastName: true, title: true } },
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
  })

  // Reshape to match EventCard's expected shape
  const reshape = (e: typeof eventsByLocation[number]) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    eventType: e.eventType,
    timeStart: e.timeStart?.toISOString() ?? '',
    timeEnd: e.timeEnd?.toISOString() ?? null,
    locationType: e.locationType,
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

  const schlossEvents = eventsByLocation.filter((e) => e.locationType === 'INFOMARKT_SCHLOSS').map(reshape)
  const cnEvents = eventsByLocation.filter((e) => e.locationType === 'INFOMARKT_CN').map(reshape)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/events" className="inline-flex items-center gap-1 text-sm text-hit-gray-500 hover:text-hit-uni-500">
          <ArrowLeft className="h-4 w-4" /> Zurück zur Übersicht
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-hit-gray-900">Infomärkte</h1>
        <p className="mt-2 max-w-2xl text-hit-gray-600">
          An den Infomärkten an zwei Standorten beraten Studierende und Mitarbeitende der
          Universität und Hochschule rund um die Studienorientierung. Hier können Sie ohne
          Anmeldung jederzeit vorbeischauen, Fragen stellen und sich Materialien mitnehmen.
        </p>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-hit-uni-500" />
          <h2 className="text-xl font-semibold text-hit-gray-900">Schloss</h2>
        </div>
        {schlossEvents.length === 0 ? (
          <p className="text-hit-gray-500">Noch keine Infomarkt-Veranstaltungen am Schloss.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {schlossEvents.map((e) => (<EventCard key={e.id} event={e as never} viewMode="list" />))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-hit-hs-500" />
          <h2 className="text-xl font-semibold text-hit-gray-900">Caprivi</h2>
        </div>
        {cnEvents.length === 0 ? (
          <p className="text-hit-gray-500">Noch keine Infomarkt-Veranstaltungen am Caprivi-Campus.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {cnEvents.map((e) => (<EventCard key={e.id} event={e as never} viewMode="list" />))}
          </div>
        )}
      </section>
    </div>
  )
}
