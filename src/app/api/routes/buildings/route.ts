// Route Planning API - Buildings Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getAllBuildings, findBuilding } from '@/services/route-service'
import type { BuildingInfo } from '@/types/routes'

/**
 * GET /api/routes/buildings
 * Get all campus buildings with event counts
 * Query params:
 * - campus: filter by campus (schloss, westerberg, caprivi, haste)
 * - search: search by name
 * - withEvents: only return buildings with events (boolean)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campus = searchParams.get('campus')
    const search = searchParams.get('search')
    const withEvents = searchParams.get('withEvents') === 'true'

    let buildings = await getAllBuildings()

    // Filter by campus
    if (campus) {
      buildings = buildings.filter((b) => b.campus === campus)
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      buildings = buildings.filter(
        (b) =>
          b.name.toLowerCase().includes(searchLower) ||
          (b.shortName && b.shortName.toLowerCase().includes(searchLower)) ||
          b.address.toLowerCase().includes(searchLower)
      )
    }

    // Filter to only buildings with events
    if (withEvents) {
      buildings = buildings.filter((b) => (b.eventCount || 0) > 0)
    }

    // Group by campus for convenience
    const grouped = {
      schloss: buildings.filter((b) => b.campus === 'schloss'),
      westerberg: buildings.filter((b) => b.campus === 'westerberg'),
      caprivi: buildings.filter((b) => b.campus === 'caprivi'),
      haste: buildings.filter((b) => b.campus === 'haste'),
      other: buildings.filter((b) => b.campus === 'other'),
    }

    return NextResponse.json({
      buildings,
      grouped,
      totalCount: buildings.length,
    })
  } catch (error) {
    console.error('Buildings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buildings' },
      { status: 500 }
    )
  }
}
