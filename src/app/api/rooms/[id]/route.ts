// Rooms API - PUT and DELETE for individual room

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/rooms/[id] - Update a room (requires admin)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const existing = await prisma.room.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Raum nicht gefunden' }, { status: 404 })
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        name: name.trim(),
        floor: floor?.trim() || null,
      },
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Raums' }, { status: 500 })
  }
}

/**
 * DELETE /api/rooms/[id] - Delete a room (requires admin)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.room.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Raum nicht gefunden' }, { status: 404 })
    }

    await prisma.room.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Raums' }, { status: 500 })
  }
}
