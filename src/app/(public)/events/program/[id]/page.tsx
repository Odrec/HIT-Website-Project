import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'
import { EventListView } from '@/components/events/EventListView'

export const dynamic = 'force-dynamic'

export default async function ProgramEventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const program = await prisma.studyProgram.findUnique({
    where: { id },
    select: { id: true, name: true, institution: true, url: true },
  })
  if (!program) notFound()

  const accentColor =
    program.institution === 'HOCHSCHULE'
      ? 'border-hit-hs-500 text-hit-hs-600'
      : 'border-hit-uni-500 text-hit-uni-600'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-1 text-sm text-hit-gray-500 hover:text-hit-uni-500"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück zur Übersicht
        </Link>
        <div className="mt-3">
          <span
            className={`inline-block border-b-2 pb-1 text-xs font-bold uppercase tracking-wide ${accentColor}`}
          >
            {program.institution === 'HOCHSCHULE' ? 'Hochschule' : 'Universität'} · Studiengang
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-hit-gray-900">{program.name}</h1>
          {program.url && (
            <a
              href={program.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-hit-uni-600 hover:underline"
            >
              Zur Studiengang-Seite <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
      <EventListView staticFilters={{ studyProgramId: id }} />
    </div>
  )
}
