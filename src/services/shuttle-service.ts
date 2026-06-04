import { prisma } from '@/lib/db/prisma'
import type { BusPositionUpdate, BusPositionResponse } from '@/types/shuttle'

export function isBusPaused(
  bus: { pausedUntil: Date | null; pausedIndefinitely: boolean },
  now: number = Date.now()
): boolean {
  if (bus.pausedIndefinitely) return true
  return bus.pausedUntil != null && bus.pausedUntil.getTime() > now
}

export async function validateGuideToken(token: string) {
  const bus = await prisma.shuttleBus.findUnique({
    where: { token },
    select: { id: true, number: true, name: true, active: true },
  })

  if (!bus || !bus.active) return null
  return bus
}

/**
 * Current state for a guide's bus (by token): name + live pause state. Used by
 * the guide page on mount to re-hydrate the pause UI after a reload.
 */
export async function getGuideBusState(token: string) {
  const bus = await prisma.shuttleBus.findUnique({
    where: { token },
    select: {
      name: true,
      active: true,
      pausedUntil: true,
      pausedIndefinitely: true,
    },
  })
  if (!bus || !bus.active) return null
  return {
    busName: bus.name,
    paused: isBusPaused(bus),
    pausedUntil: bus.pausedUntil ? bus.pausedUntil.toISOString() : null,
  }
}

export async function updateBusPosition(busId: string, position: BusPositionUpdate) {
  await prisma.busPosition.upsert({
    where: { busId },
    create: {
      busId,
      latitude: position.latitude,
      longitude: position.longitude,
      heading: position.heading ?? null,
      speed: position.speed ?? null,
    },
    update: {
      latitude: position.latitude,
      longitude: position.longitude,
      heading: position.heading ?? null,
      speed: position.speed ?? null,
    },
  })
}

export async function getAllBusPositions(): Promise<BusPositionResponse[]> {
  const buses = await prisma.shuttleBus.findMany({
    where: { active: true },
    include: { position: true },
  })

  const now = Date.now()
  const STALE_THRESHOLD_MS = 60_000

  return buses
    .filter((bus) => bus.position !== null)
    .map((bus) => ({
      id: bus.id,
      number: bus.number,
      name: bus.name,
      latitude: bus.position!.latitude,
      longitude: bus.position!.longitude,
      heading: bus.position!.heading,
      speed: bus.position!.speed,
      updatedAt: bus.position!.updatedAt.toISOString(),
      stale: now - bus.position!.updatedAt.getTime() > STALE_THRESHOLD_MS,
      paused: isBusPaused(bus, now),
      pausedUntil: bus.pausedUntil ? bus.pausedUntil.toISOString() : null,
    }))
}

function generateToken(): string {
  return crypto.randomUUID()
}

export async function createShuttleBus(name: string, number: number) {
  return prisma.shuttleBus.create({
    data: {
      name,
      number,
      token: generateToken(),
      active: true,
    },
  })
}

export async function deleteShuttleBus(id: string) {
  await prisma.shuttleBus.delete({ where: { id } })
}

export async function regenerateToken(id: string) {
  return prisma.shuttleBus.update({
    where: { id },
    data: { token: generateToken() },
  })
}

export async function getAllShuttleBuses() {
  return prisma.shuttleBus.findMany({
    include: { position: true },
    orderBy: { number: 'asc' },
  })
}

export async function toggleShuttleBus(id: string, active: boolean) {
  return prisma.shuttleBus.update({
    where: { id },
    data: { active },
  })
}

export async function setBusPause(
  id: string,
  { until, indefinite }: { until: Date | null; indefinite: boolean }
) {
  return prisma.shuttleBus.update({
    where: { id },
    data: { pausedUntil: until, pausedIndefinitely: indefinite },
  })
}

export async function resumeBus(id: string) {
  return prisma.shuttleBus.update({
    where: { id },
    data: { pausedUntil: null, pausedIndefinitely: false },
  })
}
