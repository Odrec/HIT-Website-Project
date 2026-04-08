import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { fetchWalkingDirections } from '@/services/google-directions'

// Building coordinates for seeding — IDs must match OSNABRUECK_BUILDINGS in types/routes.ts
const SEED_BUILDINGS = [
  { id: 'schloss', lat: 52.2728, lng: 8.0432 },
  { id: 'uos-aula', lat: 52.2725, lng: 8.0438 },
  { id: 'seminarstrasse', lat: 52.2718, lng: 8.0445 },
  { id: 'avz', lat: 52.2816, lng: 8.0234 },
  { id: 'biologie', lat: 52.2802, lng: 8.0241 },
  { id: 'physik', lat: 52.2821, lng: 8.0252 },
  { id: 'chemie', lat: 52.2809, lng: 8.0263 },
  { id: 'mathematik', lat: 52.2827, lng: 8.0239 },
  { id: 'eihu', lat: 52.2831, lng: 8.0227 },
  { id: 'caprivi-a', lat: 52.2756, lng: 8.0148 },
  { id: 'caprivi-b', lat: 52.2761, lng: 8.0155 },
  { id: 'caprivi-c', lat: 52.2766, lng: 8.0162 },
  { id: 'caprivi-mensa', lat: 52.2751, lng: 8.0141 },
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
    schloss: ['schloss', 'uos-aula', 'seminarstrasse'],
    westerberg: ['avz', 'biologie', 'physik', 'chemie', 'mathematik', 'eihu'],
    caprivi: ['caprivi-a', 'caprivi-b', 'caprivi-c', 'caprivi-mensa'],
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
