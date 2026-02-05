// Events API - GET (single), PUT (update), DELETE endpoints

import { NextRequest, NextResponse } from 'next/server'
import { eventService } from '@/services'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { EventType, Institution, LocationType } from '@/types/events'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/events/[id] - Get a single event by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'ORGANIZER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if event exists
    const existing = await eventService.getById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Validate enum values if provided
    if (body.eventType && !Object.values(EventType).includes(body.eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${Object.values(EventType).join(', ')}` },
        { status: 400 }
      )
    }

    if (body.locationType && !Object.values(LocationType).includes(body.locationType)) {
      return NextResponse.json(
        {
          error: `Invalid locationType. Must be one of: ${Object.values(LocationType).join(', ')}`,
        },
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
    // Convert 'none' locationId to null (placeholder value from form)
    const locationId = body.locationId === 'none' || body.locationId === '' ? null : body.locationId

    const updateData = {
      id,
      ...body,
      locationId,
      timeStart: body.timeStart ? new Date(body.timeStart) : undefined,
      timeEnd: body.timeEnd ? new Date(body.timeEnd) : undefined,
    }

    const event = await eventService.update(updateData)

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

/**
 * DELETE /api/events/[id] - Delete an event (requires authentication)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
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
