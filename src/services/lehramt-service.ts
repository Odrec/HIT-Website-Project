// Lehramt page data — programs grouped by Binnendifferenzierung.
// Events are NOT loaded here; the page fetches them lazily per section
// via /api/events/public (studyProgramId filter), which already scopes to
// the active edition and PUBLISHED events.

import { prisma } from '@/lib/db/prisma'
import { groupLehramtPrograms, type LehramtTypValue } from '@/lib/lehramt'

export interface LehramtProgram {
  id: string
  name: string
  institution: string
  lehramtTypen: LehramtTypValue[]
  isLehramtStudiengang: boolean
  isBeruflicheFachrichtung: boolean
  links: Array<{ label: string; url: string }>
}

export async function getLehramtPageData() {
  const programs = await prisma.studyProgram.findMany({
    where: { lehramtTypen: { isEmpty: false } },
    select: {
      id: true,
      name: true,
      institution: true,
      lehramtTypen: true,
      isLehramtStudiengang: true,
      isBeruflicheFachrichtung: true,
      links: { select: { label: true, url: true }, orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { name: 'asc' },
  })

  const flattened: LehramtProgram[] = programs.map((p) => ({
    id: p.id,
    name: p.name,
    institution: p.institution,
    lehramtTypen: p.lehramtTypen as LehramtTypValue[],
    isLehramtStudiengang: p.isLehramtStudiengang,
    isBeruflicheFachrichtung: p.isBeruflicheFachrichtung,
    links: p.links,
  }))

  return groupLehramtPrograms(flattened)
}
