import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/titles
 * Public: returns the admin-managed title vocabulary, sorted.
 * Used by the Melder and Dozent title comboboxes.
 */
export async function GET() {
  const titles = await prisma.title.findMany({
    orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
  })
  return NextResponse.json(titles)
}

/**
 * POST /api/titles — admin only. Creates a new title entry.
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const value = typeof body?.value === 'string' ? body.value.trim() : ''
  const sortOrder = typeof body?.sortOrder === 'number' ? body.sortOrder : 0

  if (!value) {
    return NextResponse.json({ error: 'Wert ist erforderlich' }, { status: 400 })
  }
  if (value.length > 50) {
    return NextResponse.json({ error: 'Wert darf maximal 50 Zeichen haben' }, { status: 400 })
  }

  try {
    const title = await prisma.title.create({ data: { value, sortOrder } })
    return NextResponse.json(title, { status: 201 })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ error: 'Titel existiert bereits' }, { status: 409 })
    }
    console.error('Error creating title:', err)
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}
