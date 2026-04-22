import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/titles/[id] — admin only. Update value and/or sortOrder.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const value = typeof body?.value === 'string' ? body.value.trim() : undefined
  const sortOrder = typeof body?.sortOrder === 'number' ? body.sortOrder : undefined

  if (value !== undefined && value.length === 0) {
    return NextResponse.json({ error: 'Wert darf nicht leer sein' }, { status: 400 })
  }
  if (value !== undefined && value.length > 50) {
    return NextResponse.json({ error: 'Wert darf maximal 50 Zeichen haben' }, { status: 400 })
  }

  try {
    const title = await prisma.title.update({
      where: { id },
      data: {
        ...(value !== undefined && { value }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })
    return NextResponse.json(title)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err) {
      if (err.code === 'P2002') {
        return NextResponse.json({ error: 'Titel existiert bereits' }, { status: 409 })
      }
      if (err.code === 'P2025') {
        return NextResponse.json({ error: 'Titel nicht gefunden' }, { status: 404 })
      }
    }
    console.error('Error updating title:', err)
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }
}

/**
 * DELETE /api/titles/[id] — admin only.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    await prisma.title.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
      return NextResponse.json({ error: 'Titel nicht gefunden' }, { status: 404 })
    }
    console.error('Error deleting title:', err)
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 })
  }
}
