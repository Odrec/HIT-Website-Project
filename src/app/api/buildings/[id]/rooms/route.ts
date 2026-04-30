// Rooms API - POST to create a room for a building

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/auth'
import { invalidateBuildingCaches } from '@/lib/cache/cache-utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/buildings/[id]/rooms - Create a room for a building (requires admin)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, floor } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }

    const building = await prisma.building.findUnique({ where: { id } })
    if (!building) {
      return NextResponse.json({ error: 'Gebäude nicht gefunden' }, { status: 404 })
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        floor: floor?.trim() || null,
        buildingId: id,
      },
    })

    await invalidateBuildingCaches()

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Raums' }, { status: 500 })
  }
}
