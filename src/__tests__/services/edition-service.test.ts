import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFindMany = vi.fn()
const mockFindUnique = vi.fn()
const mockFindFirst = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    hitEdition: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    event: { count: vi.fn().mockResolvedValue(0) },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

import {
  listEditions,
  getEdition,
  createEdition,
  updateEdition,
  deleteEdition,
  activateEdition,
  isDeadlinePassed,
  getDeadlineInfo,
} from '@/services/edition-service'

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('listEditions', () => {
  it('returns editions newest-first by year', async () => {
    mockFindMany.mockResolvedValue([{ id: 'e1', year: 2027 }, { id: 'e2', year: 2026 }])
    const result = await listEditions()
    expect(result).toHaveLength(2)
    expect(mockFindMany).toHaveBeenCalledWith({ orderBy: { year: 'desc' } })
  })
})

describe('createEdition', () => {
  it('creates a DRAFT edition', async () => {
    mockCreate.mockResolvedValue({ id: 'e1', year: 2027, status: 'DRAFT' })
    await createEdition({ year: 2027, hitDate: new Date('2027-11-18') })
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ year: 2027, status: 'DRAFT' }),
    })
  })
})

describe('activateEdition', () => {
  it('flips target to ACTIVE and old ACTIVE to ARCHIVED in one transaction', async () => {
    mockFindFirst.mockResolvedValue({ id: 'old-active', status: 'ACTIVE' })
    mockTransaction.mockImplementation(async (ops) => ops)
    await activateEdition('e1')
    expect(mockTransaction).toHaveBeenCalledOnce()
  })

  it('skips archive step when no ACTIVE edition exists yet', async () => {
    mockFindFirst.mockResolvedValue(null)
    mockTransaction.mockImplementation(async (ops) => ops)
    await activateEdition('e1')
    expect(mockTransaction).toHaveBeenCalledOnce()
  })
})

describe('deleteEdition', () => {
  it('refuses to delete an edition that has events', async () => {
    mockFindUnique.mockResolvedValue({ id: 'e1', status: 'DRAFT' })
    const mockPrisma = await import('@/lib/db/prisma')
    ;(mockPrisma.prisma.event.count as ReturnType<typeof vi.fn>).mockResolvedValue(3)
    await expect(deleteEdition('e1')).rejects.toThrow('has events')
  })

  it('deletes DRAFT edition with zero events', async () => {
    mockFindUnique.mockResolvedValue({ id: 'e1', status: 'DRAFT' })
    const mockPrisma = await import('@/lib/db/prisma')
    ;(mockPrisma.prisma.event.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    await deleteEdition('e1')
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'e1' } })
  })

  it('refuses to delete ACTIVE or ARCHIVED editions even when empty', async () => {
    mockFindUnique.mockResolvedValue({ id: 'e1', status: 'ACTIVE' })
    await expect(deleteEdition('e1')).rejects.toThrow('Only DRAFT')
  })
})

describe('isDeadlinePassed', () => {
  it('returns true when now > deadline and enabled', async () => {
    vi.setSystemTime(new Date('2026-10-20'))
    mockFindFirst.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
      submissionDeadline: new Date('2026-10-15'),
      deadlineEnabled: true,
    })
    expect(await isDeadlinePassed()).toBe(true)
  })

  it('returns false when deadline disabled', async () => {
    vi.setSystemTime(new Date('2026-10-20'))
    mockFindFirst.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
      submissionDeadline: new Date('2026-10-15'),
      deadlineEnabled: false,
    })
    expect(await isDeadlinePassed()).toBe(false)
  })

  it('returns false when no deadline set', async () => {
    vi.setSystemTime(new Date('2026-10-20'))
    mockFindFirst.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
      submissionDeadline: null,
      deadlineEnabled: true,
    })
    expect(await isDeadlinePassed()).toBe(false)
  })
})

describe('getDeadlineInfo', () => {
  it('returns days remaining for future deadline', async () => {
    vi.setSystemTime(new Date('2026-09-15'))
    mockFindFirst.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
      submissionDeadline: new Date('2026-10-15'),
      deadlineEnabled: true,
    })
    const info = await getDeadlineInfo()
    expect(info.passed).toBe(false)
    expect(info.daysRemaining).toBe(30)
  })

  it('returns passed=true when deadline in the past', async () => {
    vi.setSystemTime(new Date('2026-10-20'))
    mockFindFirst.mockResolvedValue({
      id: 'e1',
      status: 'ACTIVE',
      submissionDeadline: new Date('2026-10-15'),
      deadlineEnabled: true,
    })
    const info = await getDeadlineInfo()
    expect(info.passed).toBe(true)
    expect(info.daysRemaining).toBeNull()
  })
})