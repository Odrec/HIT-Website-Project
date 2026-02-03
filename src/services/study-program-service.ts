// Study Program Service - Business logic for study programs

import { prisma } from '@/lib/db/prisma'
import type { Institution } from '@/types/events'

/**
 * Study Program service for queries
 */
export const studyProgramService = {
  /**
   * List all study programs
   */
  async list(filters?: { institution?: Institution }) {
    return prisma.studyProgram.findMany({
      where: filters?.institution ? { institution: filters.institution } : undefined,
      include: {
        cluster: true,
      },
      orderBy: [
        { institution: 'asc' },
        { name: 'asc' },
      ],
    })
  },

  /**
   * Get study program by ID
   */
  async getById(id: string) {
    return prisma.studyProgram.findUnique({
      where: { id },
      include: {
        cluster: true,
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
    return prisma.studyProgramCluster.findMany({
      include: {
        programs: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
  },

  /**
   * Get programs grouped by cluster
   */
  async getGroupedByCluster(institution?: Institution) {
    const clusters = await prisma.studyProgramCluster.findMany({
      include: {
        programs: {
          where: institution ? { institution } : undefined,
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Also get programs without a cluster
    const unclustered = await prisma.studyProgram.findMany({
      where: {
        clusterId: null,
        ...(institution ? { institution } : {}),
      },
      orderBy: { name: 'asc' },
    })

    return {
      clusters,
      unclustered,
    }
  },
}

export default studyProgramService
