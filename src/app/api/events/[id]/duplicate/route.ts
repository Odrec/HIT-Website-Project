// Events API - Duplicate endpoint

import { NextRequest, NextResponse } from 'next/server'
import { eventService } from '@/services'
import { auth } from '@/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/events/[id]/duplicate - Duplicate an event (requires authentication)
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth()
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'ORGANIZER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if event exists
    const existing = await eventService.getById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const duplicatedEvent = await eventService.duplicate(id)

    return NextResponse.json(duplicatedEvent, { status: 201 })
  } catch (error) {
    console.error('Error duplicating event:', error)
    return NextResponse.json({ error: 'Failed to duplicate event' }, { status: 500 })
  }
}
