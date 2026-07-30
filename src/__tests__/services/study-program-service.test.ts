import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStudyProgramFindMany = vi.fn()
const mockClusterFindMany = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    studyProgram: {
      findMany: (...args: unknown[]) => mockStudyProgramFindMany(...args),
    },
    studyProgramCluster: {
      findMany: (...args: unknown[]) => mockClusterFindMany(...args),
    },
  },
}))

beforeEach(() => vi.clearAllMocks())

import { studyProgramService } from '@/services/study-program-service'

describe('studyProgramService.list', () => {
  it('orders UNI before HOCHSCHULE before BOTH (enum declaration order), not alphabetically', async () => {
    // Deliberately returned in an order that would look "sorted" under a plain
    // string compare (BOTH < HOCHSCHULE < UNI) to catch a regression to
    // localeCompare-on-institution, which inverts the enum's declared order.
    mockStudyProgramFindMany.mockResolvedValue([
      { id: 'both1', name: 'Beide A', institution: 'BOTH', clusters: [], links: [] },
      { id: 'hs1', name: 'HS A', institution: 'HOCHSCHULE', clusters: [], links: [] },
      { id: 'uni1', name: 'Uni A', institution: 'UNI', clusters: [], links: [] },
    ])

    const result = await studyProgramService.list()

    expect(result.map((p) => p.id)).toEqual(['uni1', 'hs1', 'both1'])
  })

  it('sorts by German name order within an institution group', async () => {
    mockStudyProgramFindMany.mockResolvedValue([
      { id: 'o', name: 'Ökotrophologie', institution: 'UNI', clusters: [], links: [] },
      { id: 'b', name: 'Biologie', institution: 'UNI', clusters: [], links: [] },
    ])

    const result = await studyProgramService.list()

    expect(result.map((p) => p.name)).toEqual(['Biologie', 'Ökotrophologie'])
  })
})

describe('studyProgramService.listClusters', () => {
  it('orders by sortOrder ascending, German name as tie-break, and sorts nested programs', async () => {
    mockClusterFindMany.mockResolvedValue([
      {
        id: 'c1',
        name: 'Zentrale Angebote',
        sortOrder: 0,
        programs: [
          { id: 'p1', name: 'Ökotrophologie' },
          { id: 'p2', name: 'Biologie' },
        ],
      },
      { id: 'c2', name: 'Mathematik', sortOrder: 5, programs: [] },
      { id: 'c3', name: 'Anglistik', sortOrder: 5, programs: [] },
    ])

    const result = await studyProgramService.listClusters()

    // sortOrder 0 first, then within sortOrder 5 the German-alphabetically-first name.
    expect(result.map((c) => c.id)).toEqual(['c1', 'c3', 'c2'])
    expect(result[0].programs.map((p) => p.name)).toEqual(['Biologie', 'Ökotrophologie'])
  })
})

describe('studyProgramService.getGroupedByCluster', () => {
  it('orders clusters by sortOrder/name, sorts nested programs and unclustered by German name', async () => {
    mockClusterFindMany.mockResolvedValue([
      {
        id: 'c1',
        name: 'Zentrale Angebote',
        sortOrder: 0,
        programs: [
          { id: 'p1', name: 'Ökotrophologie', links: [] },
          { id: 'p2', name: 'Biologie', links: [] },
        ],
      },
      { id: 'c2', name: 'Anglistik', sortOrder: 5, programs: [] },
    ])
    mockStudyProgramFindMany.mockResolvedValue([
      { id: 'u1', name: 'Zoologie', links: [] },
      { id: 'u2', name: 'Äquivalenzstudium', links: [] },
    ])

    const result = await studyProgramService.getGroupedByCluster()

    expect(result.clusters.map((c) => c.id)).toEqual(['c1', 'c2'])
    expect(result.clusters[0].programs.map((p) => p.name)).toEqual(['Biologie', 'Ökotrophologie'])
    expect(result.unclustered.map((p) => p.name)).toEqual(['Äquivalenzstudium', 'Zoologie'])
  })
})
