// Locations API - GET and POST endpoints

import { NextRequest, NextResponse } from 'next/server'
import { locationService } from '@/services'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

/**
 * GET /api/locations - List all locations
 */
export async function GET() {
  try {
    const locations = await locationService.list()
    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/locations - Create a new location (requires admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.buildingName) {
      return NextResponse.json(
        { error: 'Missing required field: buildingName' },
        { status: 400 }
      )
    }

    const location = await locationService.create({
      buildingName: body.buildingName,
      roomNumber: body.roomNumber,
      address: body.address,
      latitude: body.latitude ? parseFloat(body.latitude) : undefined,
      longitude: body.longitude ? parseFloat(body.longitude) : undefined,
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}
