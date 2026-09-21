// Navigator sessions live in Redis (key navigator:session:<id>, 2 h TTL) so
// they survive container restarts. When Redis is unreachable we fall back to
// a process-local Map so the navigator keeps working in dev / degraded mode.

import { redis, isRedisConnected } from '@/lib/cache/redis'
import type { NavigatorSession, NavigatorMessage } from '@/types/navigator'

export const NAVIGATOR_SESSION_TTL_SECONDS = 7200

const KEY_PREFIX = 'navigator:session:'

const globalForSessions = globalThis as unknown as {
  navigatorSessions: Map<string, NavigatorSession> | undefined
}
const memory = globalForSessions.navigatorSessions ?? new Map<string, NavigatorSession>()
if (process.env.NODE_ENV !== 'production') {
  globalForSessions.navigatorSessions = memory
}

type SerializedMessage = Omit<NavigatorMessage, 'timestamp'> & { timestamp: string }
type SerializedSession = Omit<NavigatorSession, 'startedAt' | 'messages'> & {
  startedAt: string
  messages: SerializedMessage[]
}

function serialize(session: NavigatorSession): string {
  const out: SerializedSession = {
    ...session,
    startedAt: session.startedAt.toISOString(),
    messages: session.messages.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() })),
  }
  return JSON.stringify(out)
}

function deserialize(raw: string): NavigatorSession {
  const s = JSON.parse(raw) as SerializedSession
  return {
    ...s,
    startedAt: new Date(s.startedAt),
    messages: s.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
  }
}

export async function getNavigatorSession(id: string): Promise<NavigatorSession | null> {
  if (await isRedisConnected()) {
    try {
      const raw = await redis.get(KEY_PREFIX + id)
      return raw ? deserialize(raw) : null
    } catch (error) {
      console.error('[navigator] redis get failed, using memory:', error)
    }
  }
  return memory.get(id) ?? null
}

export async function saveNavigatorSession(session: NavigatorSession): Promise<void> {
  if (await isRedisConnected()) {
    try {
      await redis.set(
        KEY_PREFIX + session.id,
        serialize(session),
        'EX',
        NAVIGATOR_SESSION_TTL_SECONDS
      )
      return
    } catch (error) {
      console.error('[navigator] redis set failed, using memory:', error)
    }
  }
  memory.set(session.id, session)
}

export async function deleteNavigatorSession(id: string): Promise<void> {
  memory.delete(id)
  if (await isRedisConnected()) {
    try {
      await redis.del(KEY_PREFIX + id)
    } catch (error) {
      console.error('[navigator] redis del failed:', error)
    }
  }
}
