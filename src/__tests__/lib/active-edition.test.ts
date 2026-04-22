import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindFirst = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    hitEdition: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('getActiveEdition', () => {
  it('returns the single ACTIVE edition', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'edition-2026',
      year: 2026,
      hitDate: new Date('2026-11-19'),
      status: 'ACTIVE',
    })
    const { getActiveEdition } = await import('@/lib/active-edition')
    const edition = await getActiveEdition()
    expect(edition.id).toBe('edition-2026')
    expect(mockFindFirst).toHaveBeenCalledWith({ where: { status: 'ACTIVE' } })
  })

  it('throws when no ACTIVE edition exists', async () => {
    mockFindFirst.mockResolvedValue(null)
    const { getActiveEdition } = await import('@/lib/active-edition')
    await expect(getActiveEdition()).rejects.toThrow('No ACTIVE HitEdition')
  })
})

describe('getActiveEditionId', () => {
  it('returns just the id of the active edition', async () => {
    mockFindFirst.mockResolvedValue({ id: 'edition-2026', year: 2026, status: 'ACTIVE' })
    const { getActiveEditionId } = await import('@/lib/active-edition')
    expect(await getActiveEditionId()).toBe('edition-2026')
  })
})