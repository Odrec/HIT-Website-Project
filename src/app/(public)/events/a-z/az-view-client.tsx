'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDownAZ, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  type AZInstitution,
  type AZProgram,
  filterProgramsByInstitution,
  groupProgramsByLetter,
} from '@/lib/az-programs'

const TOGGLES: Array<{ value: AZInstitution; label: string }> = [
  { value: 'all', label: 'Alle Studiengänge A-Z' },
  { value: 'UNI', label: 'Studiengänge Universität A-Z' },
  { value: 'HOCHSCHULE', label: 'Studiengänge Hochschule A-Z' },
]

export function AZViewClient() {
  const [programs, setPrograms] = useState<AZProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<AZInstitution>('all')

  useEffect(() => {
    fetch('/api/study-programs')
      .then((r) => r.json())
      .then((data: AZProgram[]) => {
        setPrograms(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const groups = useMemo(
    () => groupProgramsByLetter(filterProgramsByInstitution(programs, filter)),
    [programs, filter]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-hit-uni-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TOGGLES.map((t) => (
          <Button
            key={t.value}
            variant={filter === t.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="py-12 text-center text-hit-gray-500">Keine Studiengänge gefunden.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1">
            {groups.map((g) => (
              <a
                key={g.letter}
                href={`#letter-${g.letter}`}
                className="flex h-8 w-8 items-center justify-center rounded bg-hit-uni-50 text-sm font-semibold text-hit-uni-700 hover:bg-hit-uni-100"
              >
                {g.letter}
              </a>
            ))}
          </div>

          {groups.map((g) => (
            <div key={g.letter} id={`letter-${g.letter}`}>
              <h2 className="mb-3 text-2xl font-bold text-hit-uni-600">{g.letter}</h2>
              <Card>
                <CardContent className="p-0">
                  <ul className="divide-y divide-hit-gray-100">
                    {g.programs.map((program) => (
                      <li key={program.id}>
                        <Link
                          href={`/events/program/${program.id}`}
                          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-hit-gray-50"
                        >
                          <span className="flex items-center gap-2">
                            <ArrowDownAZ className="h-4 w-4 text-hit-uni-400" />
                            <span className="font-medium">{program.name}</span>
                          </span>
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              program.institution === 'HOCHSCHULE'
                                ? 'text-hit-hs-500'
                                : 'text-hit-uni-500'
                            )}
                          >
                            {program.institution === 'UNI'
                              ? 'Uni'
                              : program.institution === 'HOCHSCHULE'
                                ? 'HS'
                                : 'Beide'}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
