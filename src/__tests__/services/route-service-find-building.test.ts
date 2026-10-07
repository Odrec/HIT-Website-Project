import { describe, it, expect, vi, beforeEach } from 'vitest'

// Slugs are chosen freely by admins; on the test instance they include "CN",
// "AVZ" and "Fachbereich Biologie".
const rows = [
  { slug: 'mensa-cn', name: 'Mensa CN', shortName: null },
  { slug: 'CN', name: 'CN', shortName: null },
  { slug: 'Fachbereich Biologie', name: '35', shortName: 'Bio' },
  { slug: '11-aula', name: '11', shortName: 'Schloss' },
].map((r) => ({
  id: r.slug,
  address: null,
  campus: null,
  latitude: 52.27,
  longitude: 8.04,
  hasAccessibility: false,
  accessibilityNotes: null,
  ...r,
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    building: {
      findUnique: vi.fn(({ where }: { where: { slug: string } }) =>
        Promise.resolve(rows.find((r) => r.slug === where.slug) ?? null)
      ),
      findMany: vi.fn(() => Promise.resolve(rows)),
    },
  },
}))
vi.mock('@/lib/cache/redis', () => ({ redis: {}, isRedisConnected: vi.fn() }))

import { findBuilding } from '@/services/route-service'

beforeEach(() => vi.clearAllMocks())

describe('findBuilding', () => {
  it('finds a building whose slug contains capitals and spaces', async () => {
    // Routes to/from building 35 answered 404 on the test instance.
    expect((await findBuilding('Fachbereich Biologie'))?.id).toBe('Fachbereich Biologie')
  })

  it('prefers the exact slug over a building whose name merely contains it', async () => {
    expect((await findBuilding('CN'))?.id).toBe('CN')
  })

  it('still matches a slug written in different case', async () => {
    expect((await findBuilding('cn'))?.id).toBe('CN')
  })

  it('still finds a building by its short name', async () => {
    expect((await findBuilding('schloss'))?.id).toBe('11-aula')
  })
})
