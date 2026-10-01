import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { updateShuttleStop, deleteShuttleStop } from '@/services/shuttle-stop-service'
import { parseShuttleStopInput } from '@/lib/validations/shuttle-stop'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const parsed = parseShuttleStopInput(await request.json())
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const stop = await updateShuttleStop(id, parsed.data)
    if (!stop) {
      return NextResponse.json({ error: 'Haltestelle nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json(stop)
  } catch (error) {
    console.error('Error updating shuttle stop:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern der Haltestelle' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    if (!(await deleteShuttleStop(id))) {
      return NextResponse.json({ error: 'Haltestelle nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shuttle stop:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Haltestelle' }, { status: 500 })
  }
}
