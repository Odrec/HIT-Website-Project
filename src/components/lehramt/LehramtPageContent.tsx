'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { LehramtEventsSection } from './LehramtEventsSection'
import { LEHRAMT_TYP_LABELS, type GroupedLehramtPrograms, type SchulformGroup } from '@/lib/lehramt'
import type { LehramtProgram } from '@/services/lehramt-service'

function ProgramLinks({ programs }: { programs: LehramtProgram[] }) {
  const linked = programs.filter((p) => p.links.length > 0)
  if (linked.length === 0) return null
  return (
    <div className="mt-4 space-y-1">
      <h4 className="text-sm font-bold uppercase tracking-wide text-hit-gray-600">
        Studiengangsinformationen
      </h4>
      {linked.flatMap((p) =>
        p.links.map((link) => (
          <a
            key={`${p.id}-${link.url}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-hit-uni-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            {p.name}
            {link.label ? ` – ${link.label}` : ''}
          </a>
        ))
      )}
    </div>
  )
}

/** The Lehramt-Studiengang's events (listed first) plus its links. */
function StudiengangBlock({ program }: { program: LehramtProgram | null }) {
  if (!program) return null
  return (
    <div className="mb-6">
      <LehramtEventsSection query={{ studyProgramId: program.id }} />
      <ProgramLinks programs={[program]} />
    </div>
  )
}

/** A clickable list of Fächer/Fachrichtungen → their events (normal display). */
function FachList({
  programs,
  size = 'base',
  emptyHint,
}: {
  programs: LehramtProgram[]
  size?: 'base' | 'sm'
  emptyHint: string
}) {
  if (programs.length === 0) {
    return <p className="text-sm text-hit-gray-500">{emptyHint}</p>
  }
  const textSize = size === 'sm' ? 'text-sm' : 'text-base'
  return (
    <ul className="mt-1 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
      {programs.map((p) => (
        <li key={p.id}>
          <Link
            href={`/events/program/${p.id}`}
            className={`${textSize} text-hit-uni-600 hover:underline`}
          >
            {p.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function AllgemeinbildendeSchulform({
  group,
  label,
}: {
  group: SchulformGroup<LehramtProgram>
  label: string
}) {
  return (
    <div>
      <h3 className="mb-3 text-xl font-bold text-hit-gray-900">{label}</h3>
      <StudiengangBlock program={group.lehramtStudiengang} />
      <h4 className="mb-1 text-base font-semibold text-hit-gray-800">Unterrichtsfächer</h4>
      <FachList
        programs={group.faecher}
        emptyHint="Zurzeit sind hier keine Unterrichtsfächer hinterlegt."
      />
    </div>
  )
}

export function LehramtPageContent({ data }: { data: GroupedLehramtPrograms<LehramtProgram> }) {
  return (
    <div className="space-y-12">
      {/* Allgemeinbildende Schulen */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-hit-gray-900">
          Lehramt an allgemeinbildenden Schulen
        </h2>
        <div className="space-y-10">
          <AllgemeinbildendeSchulform
            group={data.ghr}
            label={LEHRAMT_TYP_LABELS.GRUND_HAUPT_REAL}
          />
          <AllgemeinbildendeSchulform group={data.gymnasium} label={LEHRAMT_TYP_LABELS.GYMNASIUM} />
        </div>
      </section>

      {/* Berufsbildende Schulen — anchor target for the HS Studienfeld tile */}
      <section id="berufsbildend" className="scroll-mt-24">
        <h2 className="mb-6 text-2xl font-bold text-hit-gray-900">
          Lehramt an berufsbildenden Schulen
        </h2>
        <StudiengangBlock program={data.berufsbildend.lehramtStudiengang} />
        <p className="mb-6 max-w-3xl text-hit-gray-600">
          Im Lehramt an berufsbildenden Schulen kombinieren Sie eine berufliche Fachrichtung mit
          einem allgemeinbildenden Unterrichtsfach.
        </p>

        <h3 className="mb-2 text-xl font-bold text-hit-gray-900">Berufliche Fachrichtungen</h3>
        <FachList
          programs={data.berufsbildend.fachrichtungen}
          emptyHint="Zurzeit sind keine beruflichen Fachrichtungen hinterlegt."
        />

        <h4 className="mb-2 mt-8 text-lg font-bold text-hit-gray-900">
          Allgemeinbildende Unterrichtsfächer
        </h4>
        <p className="mb-2 max-w-3xl font-medium text-amber-700">
          Achtung! Sie müssen eine berufliche Fachrichtung mit einem allgemeinbildenden
          Unterrichtsfach kombinieren!
        </p>
        <FachList
          programs={data.berufsbildend.allgemeinbildend}
          size="sm"
          emptyHint="Zurzeit sind keine allgemeinbildenden Unterrichtsfächer hinterlegt."
        />
      </section>
    </div>
  )
}
