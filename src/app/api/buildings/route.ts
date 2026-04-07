// Buildings API - GET and POST endpoints

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/auth'

/**
 * GET /api/buildings - List all buildings with rooms
 */
export async function GET() {
  try {
    const buildings = await prisma.building.findMany({
      include: { rooms: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(buildings)
  } catch (error) {
    console.error('Error fetching buildings:', error)
    return NextResponse.json({ error: 'Fehler beim Abrufen der Gebäude' }, { status: 500 })
  }
}

/**
 * POST /api/buildings - Create a new building (requires admin)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, campus } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }

    const building = await prisma.building.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        campus: campus?.trim() || null,
      },
      include: { rooms: true },
    })

    return NextResponse.json(building, { status: 201 })
  } catch (error) {
    console.error('Error creating building:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Gebäudes' }, { status: 500 })
  }
}
