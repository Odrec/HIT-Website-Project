import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockSet = vi.fn()
const mockDel = vi.fn()
const mockIsConnected = vi.fn()

vi.mock('@/lib/cache/redis', () => ({
  redis: {
    get: (...a: unknown[]) => mockGet(...a),
    set: (...a: unknown[]) => mockSet(...a),
    del: (...a: unknown[]) => mockDel(...a),
  },
  isRedisConnected: () => mockIsConnected(),
}))

import {
  getNavigatorSession,
  saveNavigatorSession,
  deleteNavigatorSession,
  NAVIGATOR_SESSION_TTL_SECONDS,
} from '@/lib/navigator-session-store'
import type { NavigatorSession } from '@/types/navigator'

function makeSession(id = 'nav-1'): NavigatorSession {
  return {
    id,
    startedAt: new Date('2026-09-21T10:00:00Z'),
    phase: 'guided',
    messages: [
      { id: 'm1', role: 'assistant', content: 'Hi', timestamp: new Date('2026-09-21T10:00:01Z') },
    ],
    recommendation: null,
    crisisDetected: false,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('navigator session store with Redis', () => {
  beforeEach(() => mockIsConnected.mockResolvedValue(true))

  it('saves JSON with the TTL and revives Dates on read', async () => {
    const s = makeSession()
    await saveNavigatorSession(s)
    expect(mockSet).toHaveBeenCalledWith(
      'navigator:session:nav-1',
      expect.any(String),
      'EX',
      NAVIGATOR_SESSION_TTL_SECONDS
    )
    const stored = mockSet.mock.calls[0][1] as string
    mockGet.mockResolvedValue(stored)
    const loaded = await getNavigatorSession('nav-1')
    expect(loaded?.startedAt).toBeInstanceOf(Date)
    expect(loaded?.messages[0].timestamp.toISOString()).toBe('2026-09-21T10:00:01.000Z')
    expect(loaded?.phase).toBe('guided')
  })

  it('returns null for unknown ids', async () => {
    mockGet.mockResolvedValue(null)
    expect(await getNavigatorSession('nope')).toBeNull()
  })

  it('deletes by key', async () => {
    await deleteNavigatorSession('nav-1')
    expect(mockDel).toHaveBeenCalledWith('navigator:session:nav-1')
  })
})

describe('navigator session store without Redis', () => {
  beforeEach(() => mockIsConnected.mockResolvedValue(false))

  it('falls back to memory and never touches redis', async () => {
    const s = makeSession('nav-mem')
    await saveNavigatorSession(s)
    expect(mockSet).not.toHaveBeenCalled()
    const loaded = await getNavigatorSession('nav-mem')
    expect(loaded?.id).toBe('nav-mem')
    await deleteNavigatorSession('nav-mem')
    expect(await getNavigatorSession('nav-mem')).toBeNull()
    expect(mockDel).not.toHaveBeenCalled()
  })
})
