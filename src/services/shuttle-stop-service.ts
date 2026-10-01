import { prisma } from '@/lib/db/prisma'
import type { ShuttleStop } from '@/types/shuttle'
import type { ShuttleStopInput } from '@/lib/validations/shuttle-stop'

type ShuttleStopRow = {
  id: string
  name: string
  latitude: number
  longitude: number
  directionsNote: string | null
}

function toShuttleStop(row: ShuttleStopRow): ShuttleStop {
  return {
    id: row.id,
    name: row.name,
    coordinates: { latitude: row.latitude, longitude: row.longitude },
    directionsNote: row.directionsNote,
  }
}

function isNotFound(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === 'P2025'
}

export async function getShuttleStops(): Promise<ShuttleStop[]> {
  const rows = await prisma.shuttleStop.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return rows.map(toShuttleStop)
}

export async function createShuttleStop(input: ShuttleStopInput): Promise<ShuttleStop> {
  const { _max } = await prisma.shuttleStop.aggregate({ _max: { sortOrder: true } })
  const row = await prisma.shuttleStop.create({
    data: { ...input, sortOrder: (_max.sortOrder ?? 0) + 1 },
  })
  return toShuttleStop(row)
}

/** `null` when the stop does not exist (any more). */
export async function updateShuttleStop(
  id: string,
  input: ShuttleStopInput
): Promise<ShuttleStop | null> {
  try {
    return toShuttleStop(await prisma.shuttleStop.update({ where: { id }, data: input }))
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

/** `false` when there was nothing to delete. */
export async function deleteShuttleStop(id: string): Promise<boolean> {
  try {
    await prisma.shuttleStop.delete({ where: { id } })
    return true
  } catch (error) {
    if (isNotFound(error)) return false
    throw error
  }
}
