import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getShuttleStops, createShuttleStop } from '@/services/shuttle-stop-service'
import { parseShuttleStopInput } from '@/lib/validations/shuttle-stop'

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    return NextResponse.json(await getShuttleStops())
  } catch (error) {
    console.error('Error fetching shuttle stops:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Haltestellen' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const parsed = parseShuttleStopInput(await request.json())
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    return NextResponse.json(await createShuttleStop(parsed.data), { status: 201 })
  } catch (error) {
    console.error('Error creating shuttle stop:', error)
    return NextResponse.json({ error: 'Fehler beim Anlegen der Haltestelle' }, { status: 500 })
  }
}
