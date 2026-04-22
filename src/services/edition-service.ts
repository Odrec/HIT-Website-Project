import { prisma } from '@/lib/db/prisma'

export interface DeadlineInfo {
  deadline: Date | null
  deadlineEnabled: boolean
  passed: boolean
  daysRemaining: number | null
}

export async function listEditions() {
  return prisma.hitEdition.findMany({ orderBy: { year: 'desc' } })
}

export async function getEdition(id: string) {
  return prisma.hitEdition.findUnique({ where: { id } })
}

export async function getActiveEditionOrNull() {
  return prisma.hitEdition.findFirst({ where: { status: 'ACTIVE' } })
}

export async function createEdition(input: {
  year: number
  hitDate: Date
  submissionDeadline?: Date | null
  deadlineEnabled?: boolean
}) {
  return prisma.hitEdition.create({
    data: {
      year: input.year,
      hitDate: input.hitDate,
      submissionDeadline: input.submissionDeadline ?? null,
      deadlineEnabled: input.deadlineEnabled ?? true,
      status: 'DRAFT',
    },
  })
}

export async function updateEdition(
  id: string,
  input: {
    hitDate?: Date
    submissionDeadline?: Date | null
    deadlineEnabled?: boolean
  }
) {
  return prisma.hitEdition.update({
    where: { id },
    data: {
      ...(input.hitDate !== undefined && { hitDate: input.hitDate }),
      ...(input.submissionDeadline !== undefined && {
        submissionDeadline: input.submissionDeadline,
      }),
      ...(input.deadlineEnabled !== undefined && { deadlineEnabled: input.deadlineEnabled }),
    },
  })
}

export async function activateEdition(id: string) {
  const currentActive = await prisma.hitEdition.findFirst({ where: { status: 'ACTIVE' } })
  const ops = [prisma.hitEdition.update({ where: { id }, data: { status: 'ACTIVE' } })]
  if (currentActive && currentActive.id !== id) {
    ops.unshift(
      prisma.hitEdition.update({ where: { id: currentActive.id }, data: { status: 'ARCHIVED' } })
    )
  }
  return prisma.$transaction(ops)
}

export async function deleteEdition(id: string) {
  const edition = await prisma.hitEdition.findUnique({ where: { id } })
  if (!edition) throw new Error('Edition not found')
  if (edition.status !== 'DRAFT') {
    throw new Error('Only DRAFT editions can be deleted')
  }
  const eventCount = await prisma.event.count({ where: { editionId: id } })
  if (eventCount > 0) {
    throw new Error(`Edition has events (${eventCount}); cannot delete`)
  }
  return prisma.hitEdition.delete({ where: { id } })
}

export async function isDeadlinePassed(editionId?: string): Promise<boolean> {
  const edition = editionId
    ? await prisma.hitEdition.findUnique({ where: { id: editionId } })
    : await getActiveEditionOrNull()

  if (!edition?.submissionDeadline || !edition.deadlineEnabled) return false
  return new Date() > edition.submissionDeadline
}

export async function getDeadlineInfo(editionId?: string): Promise<DeadlineInfo> {
  const edition = editionId
    ? await prisma.hitEdition.findUnique({ where: { id: editionId } })
    : await getActiveEditionOrNull()

  if (!edition?.submissionDeadline) {
    return { deadline: null, deadlineEnabled: edition?.deadlineEnabled ?? false, passed: false, daysRemaining: null }
  }

  const now = new Date()
  const deadline = edition.submissionDeadline
  const passed = edition.deadlineEnabled && now > deadline

  let daysRemaining: number | null = null
  if (!passed) {
    daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return {
    deadline,
    deadlineEnabled: edition.deadlineEnabled,
    passed,
    daysRemaining,
  }
}