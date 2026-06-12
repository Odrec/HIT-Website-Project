// Lehramt page data — programs grouped by Binnendifferenzierung.
// Events are NOT loaded here; the page fetches them lazily per accordion
// via /api/events/public (lehramtTyp / studyProgramId filters), which
// already scopes to the active edition and PUBLISHED events.

import { prisma } from '@/lib/db/prisma'
import { groupLehramtPrograms, type LehramtTypValue } from '@/lib/lehramt'

export interface LehramtProgram {
  id: string
  name: string
  institution: string
  lehramtTyp: LehramtTypValue | null
  isBeruflicheFachrichtung: boolean
  links: Array<{ label: string; url: string }>
  unterrichtsfaecher: Array<{ id: string; name: string }>
}

export async function getLehramtPageData() {
  const programs = await prisma.studyProgram.findMany({
    where: { lehramtTyp: { not: null } },
    select: {
      id: true,
      name: true,
      institution: true,
      lehramtTyp: true,
      isBeruflicheFachrichtung: true,
      links: { select: { label: true, url: true }, orderBy: { sortOrder: 'asc' } },
      unterrichtsfaecher: {
        select: { fach: { select: { id: true, name: true } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  const flattened: LehramtProgram[] = programs.map((p) => ({
    id: p.id,
    name: p.name,
    institution: p.institution,
    lehramtTyp: p.lehramtTyp as LehramtTypValue | null,
    isBeruflicheFachrichtung: p.isBeruflicheFachrichtung,
    links: p.links,
    unterrichtsfaecher: p.unterrichtsfaecher.map((u) => u.fach),
  }))

  return groupLehramtPrograms(flattened)
}
