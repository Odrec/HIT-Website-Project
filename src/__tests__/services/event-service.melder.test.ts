import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import { eventService } from '@/services'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    event: {
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/active-edition', () => ({
  getActiveEditionId: vi.fn().mockResolvedValue('edition-1'),
}))

vi.mock('@/lib/cache/cache-utils', () => ({
  invalidateEventCaches: vi.fn(),
}))

describe('eventService.update — Melder preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does NOT clear melderId when the field is omitted from the input', async () => {
    ;(prisma.event.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'e1' })
    await eventService.update({ id: 'e1', title: 'Updated' } as Parameters<
      typeof eventService.update
    >[0])
    const call = (prisma.event.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data).not.toHaveProperty('melderId')
  })

  it('preserves melderId when given a non-empty string', async () => {
    ;(prisma.event.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'e1' })
    await eventService.update({ id: 'e1', melderId: 'melder-123' } as Parameters<
      typeof eventService.update
    >[0])
    const call = (prisma.event.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data.melderId).toBe('melder-123')
  })

  it('does NOT null out melderId when an empty string is sent (regression)', async () => {
    ;(prisma.event.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'e1' })
    await eventService.update({ id: 'e1', melderId: '' } as Parameters<
      typeof eventService.update
    >[0])
    const call = (prisma.event.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data).not.toHaveProperty('melderId')
  })

  it('explicitly clears melderId when null is passed', async () => {
    ;(prisma.event.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'e1' })
    await eventService.update({ id: 'e1', melderId: null } as Parameters<
      typeof eventService.update
    >[0])
    const call = (prisma.event.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.data.melderId).toBeNull()
  })
})
