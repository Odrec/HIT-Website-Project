import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'
import { EventListView } from '@/components/events/EventListView'

export const dynamic = 'force-dynamic'

export default async function ClusterEventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cluster = await prisma.studyProgramCluster.findUnique({
    where: { id },
    select: { id: true, name: true, institution: true },
  })
  if (!cluster) notFound()

  const accentColor = cluster.institution === 'HOCHSCHULE' ? 'border-hit-hs-500 text-hit-hs-600' : 'border-hit-uni-500 text-hit-uni-600'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/events" className="inline-flex items-center gap-1 text-sm text-hit-gray-500 hover:text-hit-uni-500">
          <ArrowLeft className="h-4 w-4" /> Zurück zur Übersicht
        </Link>
        <div className="mt-3">
          <span className={`inline-block border-b-2 pb-1 text-xs font-bold uppercase tracking-wide ${accentColor}`}>
            {cluster.institution === 'HOCHSCHULE' ? 'Hochschule' : 'Universität'} · Studienfeld
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-hit-gray-900">{cluster.name}</h1>
      </div>
      <EventListView staticFilters={{ clusterId: id }} />
    </div>
  )
}
