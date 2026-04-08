import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { fetchWalkingDirections } from '@/services/google-directions'

// Building coordinates for seeding (all buildings except Haste)
const SEED_BUILDINGS = [
  { id: 'schloss', lat: 52.2725, lng: 8.044 },
  { id: 'aula', lat: 52.2718, lng: 8.0448 },
  { id: 'seminarstrasse', lat: 52.2722, lng: 8.0462 },
  { id: 'avz', lat: 52.2833, lng: 8.0233 },
  { id: 'biologie', lat: 52.2821, lng: 8.0261 },
  { id: 'physik', lat: 52.2808, lng: 8.0253 },
  { id: 'chemie', lat: 52.2818, lng: 8.0218 },
  { id: 'mathe-info', lat: 52.2838, lng: 8.0237 },
  { id: 'eihu', lat: 52.2843, lng: 8.0227 },
  { id: 'caprivi-a', lat: 52.2755, lng: 8.0148 },
  { id: 'caprivi-b', lat: 52.276, lng: 8.0158 },
  { id: 'caprivi-c', lat: 52.2762, lng: 8.0143 },
  { id: 'mensa-caprivi', lat: 52.2751, lng: 8.0162 },
] as const

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const results: { from: string; to: string; status: string }[] = []
  let seeded = 0
  let skipped = 0
  let errors = 0

  // Only compute cross-campus routes (same-campus walking is trivial)
  const campuses: Record<string, string[]> = {
    schloss: ['schloss', 'aula', 'seminarstrasse'],
    westerberg: ['avz', 'biologie', 'physik', 'chemie', 'mathe-info', 'eihu'],
    caprivi: ['caprivi-a', 'caprivi-b', 'caprivi-c', 'mensa-caprivi'],
  }

  const campusNames = Object.keys(campuses)

  for (let i = 0; i < campusNames.length; i++) {
    for (let j = 0; j < campusNames.length; j++) {
      if (i === j) continue // Skip same-campus pairs

      for (const fromId of campuses[campusNames[i]]) {
        for (const toId of campuses[campusNames[j]]) {
          // Check if already cached
          const existing = await prisma.cachedRoute.findUnique({
            where: {
              fromBuildingId_toBuildingId: {
                fromBuildingId: fromId,
                toBuildingId: toId,
              },
            },
          })

          if (existing) {
            skipped++
            results.push({ from: fromId, to: toId, status: 'skipped' })
            continue
          }

          const fromBuilding = SEED_BUILDINGS.find((b) => b.id === fromId)!
          const toBuilding = SEED_BUILDINGS.find((b) => b.id === toId)!

          try {
            const directions = await fetchWalkingDirections(
              fromBuilding.lat,
              fromBuilding.lng,
              toBuilding.lat,
              toBuilding.lng
            )

            await prisma.cachedRoute.create({
              data: {
                fromBuildingId: fromId,
                toBuildingId: toId,
                distanceMeters: directions.distanceMeters,
                durationSeconds: directions.durationSeconds,
                polyline: directions.polyline,
                waypoints: directions.waypoints,
              },
            })

            seeded++
            results.push({ from: fromId, to: toId, status: 'seeded' })
          } catch (error) {
            errors++
            results.push({
              from: fromId,
              to: toId,
              status: `error: ${error instanceof Error ? error.message : 'unknown'}`,
            })
          }

          // Rate limit: Google allows 50 QPS, but be conservative
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }
    }
  }

  return NextResponse.json({
    summary: { seeded, skipped, errors, total: results.length },
    results,
  })
}
