'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { LehramtAccordion } from './LehramtAccordion'
import { LehramtEventsSection } from './LehramtEventsSection'
import { LEHRAMT_TYP_LABELS, type GroupedLehramtPrograms } from '@/lib/lehramt'
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

export function LehramtPageContent({ data }: { data: GroupedLehramtPrograms<LehramtProgram> }) {
  return (
    <div className="space-y-10">
      {/* Allgemeinbildende Schulen */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-hit-gray-900">
          Lehramt an allgemeinbildenden Schulen
        </h2>
        <div className="space-y-3">
          <LehramtAccordion title={LEHRAMT_TYP_LABELS.GRUND_HAUPT_REAL}>
            <LehramtEventsSection query={{ lehramtTyp: 'GRUND_HAUPT_REAL' }} />
            <ProgramLinks programs={data.ghr} />
          </LehramtAccordion>
          <LehramtAccordion title={LEHRAMT_TYP_LABELS.GYMNASIUM}>
            <LehramtEventsSection query={{ lehramtTyp: 'GYMNASIUM' }} />
            <ProgramLinks programs={data.gymnasium} />
          </LehramtAccordion>
        </div>
      </section>

      {/* Berufsbildende Schulen */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-hit-gray-900">
          Lehramt an berufsbildenden Schulen
        </h2>
        <div className="space-y-3">
          <LehramtAccordion title={LEHRAMT_TYP_LABELS.BERUFSBILDEND}>
            <LehramtEventsSection
              query={{ lehramtTyp: 'BERUFSBILDEND', excludeFachrichtungen: 'true' }}
            />
            <ProgramLinks programs={data.bbsGeneral} />
          </LehramtAccordion>
        </div>

        <h3 className="mt-8 mb-2 text-xl font-bold text-hit-gray-900">Berufliche Fachrichtungen</h3>
        <p className="mb-4 max-w-3xl text-hit-gray-600">
          Im Lehramt für berufsbildende Schulen studiert man eine der folgenden beruflichen
          Fachrichtungen in Kombination mit einem allgemeinbildenden Unterrichtsfach.
        </p>
        {data.fachrichtungen.length === 0 ? (
          <p className="text-hit-gray-600">
            Zurzeit sind keine beruflichen Fachrichtungen hinterlegt.
          </p>
        ) : (
          <div className="space-y-3">
            {data.fachrichtungen.map((f) => (
              <LehramtAccordion key={f.id} title={f.name}>
                <LehramtEventsSection query={{ studyProgramId: f.id }} />
                <ProgramLinks programs={[f]} />
                {f.unterrichtsfaecher.length > 0 && (
                  <div className="mt-4 space-y-1">
                    <h4 className="text-sm font-bold uppercase tracking-wide text-hit-gray-600">
                      Angebote der allgemeinbildenden Unterrichtsfächer
                    </h4>
                    <ul className="space-y-1">
                      {f.unterrichtsfaecher.map((fach) => (
                        <li key={fach.id}>
                          <Link
                            href={`/events/program/${fach.id}`}
                            className="text-sm text-hit-uni-600 hover:underline"
                          >
                            {fach.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </LehramtAccordion>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
