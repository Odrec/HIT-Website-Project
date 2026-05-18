// Events API - GET (single), PUT (update), DELETE endpoints

import { NextRequest, NextResponse } from 'next/server'
import { eventService } from '@/services'
import { auth } from '@/auth'
import { EventType, Institution } from '@/types/events'
import { sendEventUpdatedEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/events/[id] - Get a single event by ID
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const event = await eventService.getById(id)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

/**
 * PUT /api/events/[id] - Update an event (requires authentication)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { role, id: userId } = session.user

    if (role !== 'ADMIN' && role !== 'ORGANIZER') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if event exists
    const existing = await eventService.getById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Ownership and deadline checks for non-admin users
    if (role !== 'ADMIN') {
      // Check deadline
      const { isDeadlinePassed } = await import('@/services/edition-service')
      if (await isDeadlinePassed()) {
        return NextResponse.json(
          { error: 'Anmeldefrist abgelaufen. Änderungen nur durch Administratoren möglich.' },
          { status: 403 }
        )
      }

      // Check ownership
      const { isEventOwner } = await import('@/lib/auth/rbac')
      if (!isEventOwner(userId, existing)) {
        return NextResponse.json(
          { error: 'Nur eigene Veranstaltungen bearbeitbar.' },
          { status: 403 }
        )
      }
    }

    // Validate enum values if provided
    if (body.eventType && !Object.values(EventType).includes(body.eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${Object.values(EventType).join(', ')}` },
        { status: 400 }
      )
    }

    if (body.institution && !Object.values(Institution).includes(body.institution)) {
      return NextResponse.json(
        { error: `Invalid institution. Must be one of: ${Object.values(Institution).join(', ')}` },
        { status: 400 }
      )
    }

    // Parse dates if provided
    const updateData: Record<string, unknown> & { id: string } = {
      id,
      ...body,
      isCrossProgram: body.isCrossProgram ?? false,
      locationHint: body.locationHint || null,
      melderId:
        typeof body.melderId === 'string' && body.melderId.length > 0
          ? body.melderId
          : body.melderId === null
            ? null
            : undefined,
      buildingId: body.buildingId || null,
      roomId: body.roomId || null,
      timeStart: body.timeStart ? new Date(body.timeStart) : undefined,
      timeEnd: body.timeEnd ? new Date(body.timeEnd) : undefined,
    }

    // Auto-promote rollover drafts on first save: DRAFT_FROM_ROLLOVER → NEEDS_REVIEW
    // unless the caller explicitly set reviewStatus in the body.
    if (
      body.reviewStatus === undefined &&
      existing &&
      'reviewStatus' in existing &&
      (existing as { reviewStatus?: string }).reviewStatus === 'DRAFT_FROM_ROLLOVER'
    ) {
      updateData.reviewStatus = 'NEEDS_REVIEW'
    }

    const event = await eventService.update(updateData as Parameters<typeof eventService.update>[0])

    // Fire-and-forget email notification with change detection
    type EmailArg = Parameters<typeof sendEventUpdatedEmail>[0]
    sendEventUpdatedEmail(existing as EmailArg, event as EmailArg).catch(() => {})

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

/**
 * DELETE /api/events/[id] - Delete an event (requires authentication)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { id } = await params

    // Check if event exists
    const existing = await eventService.getById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    await eventService.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
