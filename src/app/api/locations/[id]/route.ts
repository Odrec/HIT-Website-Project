// Locations API - GET, PUT, DELETE for individual location

import { NextRequest, NextResponse } from 'next/server'
import { locationService } from '@/services'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/locations/[id] - Get a single location
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const location = await locationService.getById(id)

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json({ error: 'Failed to fetch location' }, { status: 500 })
  }
}

/**
 * PUT /api/locations/[id] - Update a location (requires admin)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if location exists
    const existing = await locationService.getById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Validate required fields
    if (!body.buildingName) {
      return NextResponse.json({ error: 'Missing required field: buildingName' }, { status: 400 })
    }

    const location = await locationService.update(id, {
      buildingName: body.buildingName,
      roomNumber: body.roomNumber,
      address: body.address,
      latitude:
        body.latitude !== undefined && body.latitude !== null
          ? typeof body.latitude === 'number'
            ? body.latitude
            : parseFloat(body.latitude)
          : undefined,
      longitude:
        body.longitude !== undefined && body.longitude !== null
          ? typeof body.longitude === 'number'
            ? body.longitude
            : parseFloat(body.longitude)
          : undefined,
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
  }
}

/**
 * DELETE /api/locations/[id] - Delete a location (requires admin)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { id } = await params

    // Check if location exists
    const existing = await locationService.getById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check if location is in use by events
    if (existing.events && existing.events.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete location - it is used by events',
          message: `Dieser Ort wird von ${existing.events.length} Veranstaltung(en) verwendet und kann nicht gelöscht werden.`,
        },
        { status: 400 }
      )
    }

    await locationService.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
  }
}
