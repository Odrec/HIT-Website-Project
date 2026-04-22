// Buildings API - GET, PUT, DELETE for individual building

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/buildings/[id] - Get a single building with rooms
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const building = await prisma.building.findUnique({
      where: { id },
      include: { rooms: { orderBy: { name: 'asc' } } },
    })

    if (!building) {
      return NextResponse.json({ error: 'Gebäude nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(building)
  } catch (error) {
    console.error('Error fetching building:', error)
    return NextResponse.json({ error: 'Fehler beim Abrufen des Gebäudes' }, { status: 500 })
  }
}

/**
 * PUT /api/buildings/[id] - Update a building (requires admin)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      slug,
      shortName,
      address,
      campus,
      institution,
      latitude,
      longitude,
      hasAccessibility,
      accessibilityNotes,
    } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }

    const existing = await prisma.building.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Gebäude nicht gefunden' }, { status: 404 })
    }

    const validInstitutions = ['UNI', 'HOCHSCHULE', 'BOTH'] as const
    type Inst = (typeof validInstitutions)[number]
    const resolvedInstitution: Inst | undefined = validInstitutions.includes(institution)
      ? institution
      : undefined

    const building = await prisma.building.update({
      where: { id },
      data: {
        name: name.trim(),
        ...(slug !== undefined && { slug: slug.trim() }),
        shortName: shortName?.trim() || null,
        address: address?.trim() || null,
        campus: campus?.trim() || null,
        ...(resolvedInstitution !== undefined && { institution: resolvedInstitution }),
        latitude: latitude != null ? parseFloat(latitude) : null,
        longitude: longitude != null ? parseFloat(longitude) : null,
        hasAccessibility: hasAccessibility ?? existing.hasAccessibility,
        accessibilityNotes: accessibilityNotes?.trim() || null,
      },
      include: { rooms: { orderBy: { name: 'asc' } } },
    })

    return NextResponse.json(building)
  } catch (error) {
    console.error('Error updating building:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Gebäudes' }, { status: 500 })
  }
}

/**
 * DELETE /api/buildings/[id] - Delete a building (requires admin, cascades to rooms)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.building.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Gebäude nicht gefunden' }, { status: 404 })
    }

    await prisma.building.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting building:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Gebäudes' }, { status: 500 })
  }
}
