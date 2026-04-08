import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFindUnique = vi.fn()
const mockUpsert = vi.fn()
const mockCreate = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    siteSettings: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}))

import { isDeadlinePassed, getDeadlineInfo } from '@/services/settings-service'

describe('isDeadlinePassed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true when current date is after deadline and deadline is enabled', async () => {
    vi.setSystemTime(new Date('2026-10-20'))
    mockFindUnique.mockResolvedValue({
      id: 'default',
      submissionDeadline: new Date('2026-10-15'),
      deadlineEnabled: true,
    })

    expect(await isDeadlinePassed()).toBe(true)
  })

  it('returns false when current date is before deadline', async () => {
    vi.setSystemTime(new Date('2026-09-01'))
    mockFindUnique.mockResolvedValue({
      id: 'default',
      submissionDeadline: new Date('2026-10-15'),
      deadlineEnabled: true,
    })

    expect(await isDeadlinePassed()).toBe(false)
  })

  it('returns false when deadline is disabled', async () => {
    vi.setSystemTime(new Date('2026-10-20'))
    mockFindUnique.mockResolvedValue({
      id: 'default',
      submissionDeadline: new Date('2026-10-15'),
      deadlineEnabled: false,
    })

    expect(await isDeadlinePassed()).toBe(false)
  })

  it('returns false when no deadline is set', async () => {
    vi.setSystemTime(new Date('2026-10-20'))
    mockFindUnique.mockResolvedValue({
      id: 'default',
      submissionDeadline: null,
      deadlineEnabled: true,
    })

    expect(await isDeadlinePassed()).toBe(false)
  })
})

describe('getDeadlineInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns days remaining when deadline is in the future', async () => {
    vi.setSystemTime(new Date('2026-09-15'))
    mockFindUnique.mockResolvedValue({
      id: 'default',
      submissionDeadline: new Date('2026-10-15'),
      deadlineEnabled: true,
    })

    const info = await getDeadlineInfo()
    expect(info.passed).toBe(false)
    expect(info.daysRemaining).toBe(30)
  })

  it('returns passed=true and null daysRemaining when deadline is past', async () => {
    vi.setSystemTime(new Date('2026-10-20'))
    mockFindUnique.mockResolvedValue({
      id: 'default',
      submissionDeadline: new Date('2026-10-15'),
      deadlineEnabled: true,
    })

    const info = await getDeadlineInfo()
    expect(info.passed).toBe(true)
    expect(info.daysRemaining).toBeNull()
  })
})
