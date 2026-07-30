// Study Program Service - Business logic for study programs

import { prisma } from '@/lib/db/prisma'
import type { Institution } from '@/types/events'
import { compareDe, compareDeBy } from '@/lib/sort-de'

/**
 * Study Program service for queries
 */
export const studyProgramService = {
  /**
   * List all study programs
   */
  async list(filters?: { institution?: Institution }) {
    const programs = await prisma.studyProgram.findMany({
      where: filters?.institution ? { institution: filters.institution } : undefined,
      include: {
        clusters: true,
        links: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ institution: 'asc' }, { name: 'asc' }],
    })
    // Postgres runs a C collation (alpine/musl), so re-sort in German order.
    // Institution stays the primary key of the ordering.
    return programs.sort(
      (a, b) => a.institution.localeCompare(b.institution) || compareDe(a.name, b.name)
    )
  },

  /**
   * Get study program by ID
   */
  async getById(id: string) {
    return prisma.studyProgram.findUnique({
      where: { id },
      include: {
        clusters: true,
        links: { orderBy: { sortOrder: 'asc' } },
        events: {
          include: {
            event: true,
          },
        },
      },
    })
  },

  /**
   * List all clusters with their programs
   */
  async listClusters() {
    const clusters = await prisma.studyProgramCluster.findMany({
      include: {
        programs: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    // Postgres runs a C collation (alpine/musl), so re-sort in German order.
    // sortOrder stays the primary key; name is only the tie-break.
    for (const cluster of clusters) {
      cluster.programs.sort(compareDeBy((p) => p.name))
    }
    return clusters.sort((a, b) => a.sortOrder - b.sortOrder || compareDe(a.name, b.name))
  },

  /**
   * Get programs grouped by cluster
   */
  async getGroupedByCluster(institution?: Institution) {
    const clusters = await prisma.studyProgramCluster.findMany({
      include: {
        programs: {
          where: institution ? { institution } : undefined,
          include: { links: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    // Also get programs without any cluster
    const unclustered = await prisma.studyProgram.findMany({
      where: {
        clusters: { none: {} },
        ...(institution ? { institution } : {}),
      },
      include: { links: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    })

    // Postgres runs a C collation (alpine/musl), so re-sort in German order.
    // sortOrder stays the primary key for clusters; name is only the tie-break.
    for (const cluster of clusters) {
      cluster.programs.sort(compareDeBy((p) => p.name))
    }
    clusters.sort((a, b) => a.sortOrder - b.sortOrder || compareDe(a.name, b.name))
    unclustered.sort(compareDeBy((p) => p.name))

    return {
      clusters,
      unclustered,
    }
  },
}

export default studyProgramService
