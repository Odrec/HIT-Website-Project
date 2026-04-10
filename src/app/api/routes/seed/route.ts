import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { fetchWalkingDirections } from '@/services/google-directions'

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  // Load buildings from DB
  const buildings = await prisma.building.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
  })

  if (buildings.length === 0) {
    return NextResponse.json({ error: 'Keine Gebäude mit Koordinaten gefunden' }, { status: 400 })
  }

  // Group buildings by campus
  const campuses: Record<string, typeof buildings> = {}
  for (const b of buildings) {
    const campus = b.campus || 'other'
    if (!campuses[campus]) campuses[campus] = []
    campuses[campus].push(b)
  }

  const results: { from: string; to: string; status: string }[] = []
  let seeded = 0
  let skipped = 0
  let errors = 0

  const campusNames = Object.keys(campuses)

  // Only compute cross-campus routes (same-campus walking is trivial)
  for (let i = 0; i < campusNames.length; i++) {
    for (let j = 0; j < campusNames.length; j++) {
      if (i === j) continue

      for (const fromBuilding of campuses[campusNames[i]]) {
        for (const toBuilding of campuses[campusNames[j]]) {
          // Check if already cached
          const existing = await prisma.cachedRoute.findUnique({
            where: {
              fromBuildingSlug_toBuildingSlug: {
                fromBuildingSlug: fromBuilding.slug,
                toBuildingSlug: toBuilding.slug,
              },
            },
          })

          if (existing) {
            skipped++
            results.push({ from: fromBuilding.slug, to: toBuilding.slug, status: 'skipped' })
            continue
          }

          try {
            const directions = await fetchWalkingDirections(
              fromBuilding.latitude!,
              fromBuilding.longitude!,
              toBuilding.latitude!,
              toBuilding.longitude!
            )

            await prisma.cachedRoute.create({
              data: {
                fromBuildingSlug: fromBuilding.slug,
                toBuildingSlug: toBuilding.slug,
                distanceMeters: directions.distanceMeters,
                durationSeconds: directions.durationSeconds,
                polyline: directions.polyline,
                waypoints: directions.waypoints,
              },
            })

            seeded++
            results.push({ from: fromBuilding.slug, to: toBuilding.slug, status: 'seeded' })
          } catch (error) {
            errors++
            results.push({
              from: fromBuilding.slug,
              to: toBuilding.slug,
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