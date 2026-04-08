import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { toggleShuttleBus, deleteShuttleBus } from '@/services/shuttle-service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { active } = body

    if (typeof active !== 'boolean') {
      return NextResponse.json({ error: 'active (boolean) is required' }, { status: 400 })
    }

    const bus = await toggleShuttleBus(id, active)
    return NextResponse.json(bus)
  } catch (error) {
    console.error('Error updating shuttle bus:', error)
    return NextResponse.json({ error: 'Failed to update shuttle bus' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await deleteShuttleBus(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting shuttle bus:', error)
    return NextResponse.json({ error: 'Failed to delete shuttle bus' }, { status: 500 })
  }
}
