import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { findBuilding } from '@/services/route-service'
import { fetchWalkingDirections } from '@/services/google-directions'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing required params: from, to' }, { status: 400 })
  }

  const fromBuilding = await findBuilding(from)
  const toBuilding = await findBuilding(to)

  if (!fromBuilding || !toBuilding) {
    return NextResponse.json({ error: 'Building not found' }, { status: 404 })
  }

  // Check cache first
  const cached = await prisma.cachedRoute.findUnique({
    where: {
      fromBuildingSlug_toBuildingSlug: { fromBuildingSlug: from, toBuildingSlug: to },
    },
  })

  if (cached) {
    return NextResponse.json({
      distanceMeters: cached.distanceMeters,
      durationSeconds: cached.durationSeconds,
      waypoints: cached.waypoints,
    })
  }

  // Fallback: call Google Directions API and cache
  try {
    const result = await fetchWalkingDirections(
      fromBuilding.coordinates.latitude,
      fromBuilding.coordinates.longitude,
      toBuilding.coordinates.latitude,
      toBuilding.coordinates.longitude
    )

    await prisma.cachedRoute.upsert({
      where: {
        fromBuildingSlug_toBuildingSlug: { fromBuildingSlug: from, toBuildingSlug: to },
      },
      create: {
        fromBuildingSlug: from,
        toBuildingSlug: to,
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
        polyline: result.polyline,
        waypoints: result.waypoints,
      },
      update: {
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
        polyline: result.polyline,
        waypoints: result.waypoints,
      },
    })

    return NextResponse.json({
      distanceMeters: result.distanceMeters,
      durationSeconds: result.durationSeconds,
      waypoints: result.waypoints,
    })
  } catch (error) {
    console.error('Google Directions API error:', error)
    return NextResponse.json({ error: 'Failed to fetch directions' }, { status: 502 })
  }
}
