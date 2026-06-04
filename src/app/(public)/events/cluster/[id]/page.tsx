import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export default async function ClusterProgramsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cluster = await prisma.studyProgramCluster.findUnique({
    where: { id },
    include: {
      programs: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          institution: true,
          links: { select: { label: true, url: true }, orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  })
  if (!cluster) notFound()

  const isHs = cluster.institution === 'HOCHSCHULE'
  const accentColor = isHs
    ? 'border-hit-hs-500 text-hit-hs-600'
    : 'border-hit-uni-500 text-hit-uni-600'
  const tileAccent = isHs ? 'border-l-hit-hs-500' : 'border-l-hit-uni-500'

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
            {isHs ? 'Hochschule' : 'Universität'} · Studienfeld
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-hit-gray-900">{cluster.name}</h1>
        {cluster.description && (
          <p className="mt-2 max-w-3xl text-hit-gray-600">{cluster.description}</p>
        )}
      </div>

      {cluster.programs.length === 0 ? (
        <p className="text-hit-gray-600">
          In diesem Studienfeld sind aktuell keine Studiengänge hinterlegt.
        </p>
      ) : (
        <>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-hit-gray-600">
            Studiengänge
          </h2>
          <div className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cluster.programs.map((p) => (
              <div
                key={p.id}
                className={`group flex items-center gap-2 rounded-md border border-hit-gray-200 border-l-4 ${tileAccent} bg-hit-gray-50 px-4 py-3 transition-colors hover:bg-hit-gray-100 focus-within:bg-hit-gray-100`}
              >
                <Link
                  href={`/events/program/${p.id}`}
                  className="min-w-0 flex-1 text-sm text-hit-gray-900 break-words hyphens-auto"
                >
                  {p.name}
                </Link>
                {p.links.length > 0 && (
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    {p.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-hit-gray-400 hover:text-hit-uni-500"
                        aria-label={`${link.label} – ${p.name}`}
                        title={link.label}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <Link
        href={`/events/cluster/${id}/all`}
        className="inline-flex items-center gap-2 rounded-md bg-hit-gray-100 px-4 py-2 text-sm font-medium text-hit-gray-900 hover:bg-hit-gray-200"
      >
        Alle Veranstaltungen dieses Studienfelds anzeigen
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
