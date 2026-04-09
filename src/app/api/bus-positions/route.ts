import { NextRequest, NextResponse } from 'next/server'
import {
  validateGuideToken,
  updateBusPosition,
  getAllBusPositions,
} from '@/services/shuttle-service'
import { SHUTTLE_STOPS } from '@/types/shuttle'

export async function GET(_request: NextRequest) {
  try {
    const buses = await getAllBusPositions()

    return NextResponse.json(
      { buses, stops: SHUTTLE_STOPS },
      {
        headers: {
          'Cache-Control': 'public, max-age=5',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching bus positions:', error)
    return NextResponse.json({ error: 'Failed to fetch bus positions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const bus = await validateGuideToken(token)
    if (!bus) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { latitude, longitude, heading, speed } = body

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'latitude and longitude are required' }, { status: 400 })
    }

    await updateBusPosition(bus.id, { latitude, longitude, heading, speed })

    return NextResponse.json({ ok: true, busName: bus.name })
  } catch (error) {
    console.error('Error updating bus position:', error)
    return NextResponse.json({ error: 'Failed to update position' }, { status: 500 })
  }
}
