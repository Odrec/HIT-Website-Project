import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAllShuttleBuses, createShuttleBus } from '@/services/shuttle-service'

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buses = await getAllShuttleBuses()
    return NextResponse.json(buses)
  } catch (error) {
    console.error('Error fetching shuttle buses:', error)
    return NextResponse.json({ error: 'Failed to fetch shuttle buses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, number } = body

    if (!name || typeof number !== 'number') {
      return NextResponse.json({ error: 'name and number are required' }, { status: 400 })
    }

    const bus = await createShuttleBus(name, number)
    return NextResponse.json(bus, { status: 201 })
  } catch (error) {
    console.error('Error creating shuttle bus:', error)
    return NextResponse.json({ error: 'Failed to create shuttle bus' }, { status: 500 })
  }
}
