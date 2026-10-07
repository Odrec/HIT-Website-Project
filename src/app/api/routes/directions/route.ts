import { NextResponse } from 'next/server'
import { findBuilding } from '@/services/route-service'
import { getWalkingRoute } from '@/services/route-cache'

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

  if (!fromBuilding.coordinates || !toBuilding.coordinates) {
    return NextResponse.json(
      { error: 'Für mindestens ein Gebäude sind keine Koordinaten hinterlegt' },
      { status: 422 }
    )
  }

  try {
    const { route } = await getWalkingRoute(
      { slug: from, coordinates: fromBuilding.coordinates },
      { slug: to, coordinates: toBuilding.coordinates }
    )
    return NextResponse.json(route)
  } catch (error) {
    console.error('Google Directions API error:', error)
    return NextResponse.json({ error: 'Failed to fetch directions' }, { status: 502 })
  }
}
