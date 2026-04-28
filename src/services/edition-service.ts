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
    multiplikatorCafeEventId?: string | null
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
      ...(input.multiplikatorCafeEventId !== undefined && {
        multiplikatorCafeEventId: input.multiplikatorCafeEventId,
      }),
    },
  })
}

export async function activateEdition(id: string) {
  const target = await prisma.hitEdition.findUnique({ where: { id } })
  if (!target) throw new Error('Edition not found')

  const currentActive = await prisma.hitEdition.findFirst({ where: { status: 'ACTIVE' } })
  // Archive the old ACTIVE first, then flip the target — this ordering keeps the
  // "exactly one ACTIVE" invariant even if a future partial-unique index is added.
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

export interface RolloverInput {
  year: number
  hitDate: Date
  submissionDeadline?: Date | null
  cloneEvents: boolean
}

export async function rollover(input: RolloverInput) {
  return prisma.$transaction(async (tx) => {
    const previousActive = await tx.hitEdition.findFirst({ where: { status: 'ACTIVE' } })
    if (previousActive) {
      await tx.hitEdition.update({
        where: { id: previousActive.id },
        data: { status: 'ARCHIVED' },
      })
    }

    const newEdition = await tx.hitEdition.create({
      data: {
        year: input.year,
        hitDate: input.hitDate,
        submissionDeadline: input.submissionDeadline ?? null,
        deadlineEnabled: true,
        status: 'ACTIVE',
      },
    })

    let clonedCount = 0
    if (input.cloneEvents && previousActive) {
      const sourceEvents = await tx.event.findMany({
        where: { editionId: previousActive.id },
        include: {
          lecturers: true,
          organizers: true,
          studyPrograms: true,
          infoMarkets: true,
        },
      })

      const melderIds = [
        ...new Set(
          sourceEvents
            .map((e) => e.melderId)
            .filter((id): id is string => id !== null && id !== undefined)
        ),
      ]
      const existingMelderIds = melderIds.length
        ? new Set(
            (
              await tx.melder.findMany({
                where: { id: { in: melderIds } },
                select: { id: true },
              })
            ).map((m) => m.id)
          )
        : new Set<string>()

      for (const src of sourceEvents) {
        // Defensive: Melder→Event FK defaults to Restrict, so deletion of a Melder
        // with clones is blocked at the DB level. This guard catches future schema
        // changes or direct DB edits that bypass the FK.
        const melderStillExists = !!src.melderId && existingMelderIds.has(src.melderId)

        await tx.event.create({
          data: {
            title: src.title,
            description: src.description,
            eventType: src.eventType,
            timeStart: null,
            timeEnd: null,
            locationType: src.locationType,
            locationDetails: src.locationDetails ?? undefined,
            locationMode: src.locationMode,
            locationWishArea: src.locationWishArea,
            roomRequest: src.roomRequest,
            meetingPoint: src.meetingPoint,
            additionalInfo: src.additionalInfo,
            photoUrl: src.photoUrl,
            institution: src.institution,
            isCrossProgram: src.isCrossProgram,
            locationHint: src.locationHint,
            reviewStatus: 'DRAFT_FROM_ROLLOVER',
            sourceEvent: { connect: { id: src.id } },
            edition: { connect: { id: newEdition.id } },
            ...(melderStillExists && src.melderId && { melder: { connect: { id: src.melderId } } }),
            ...(src.buildingId && { building: { connect: { id: src.buildingId } } }),
            ...(src.roomId && { room: { connect: { id: src.roomId } } }),
            lecturers: {
              create: src.lecturers.map((l) => ({
                firstName: l.firstName,
                lastName: l.lastName,
                title: l.title,
                email: l.email,
                affiliation: l.affiliation,
              })),
            },
            organizers: {
              create: src.organizers.map((o) => ({
                email: o.email,
                phone: o.phone,
                internalOnly: o.internalOnly,
              })),
            },
            studyPrograms: {
              create: src.studyPrograms.map((sp) => ({ studyProgramId: sp.studyProgramId })),
            },
            infoMarkets: {
              create: src.infoMarkets.map((im) => ({ marketId: im.marketId })),
            },
          },
        })
        clonedCount++
      }
    }

    return { edition: newEdition, clonedCount }
  })
}

export async function getDeadlineInfo(editionId?: string): Promise<DeadlineInfo> {
  const edition = editionId
    ? await prisma.hitEdition.findUnique({ where: { id: editionId } })
    : await getActiveEditionOrNull()

  if (!edition?.submissionDeadline) {
    return {
      deadline: null,
      deadlineEnabled: edition?.deadlineEnabled ?? false,
      passed: false,
      daysRemaining: null,
    }
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
