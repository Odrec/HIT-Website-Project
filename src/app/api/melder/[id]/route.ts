import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const { id } = await params
  const melder = await prisma.melder.findUnique({ where: { id } })
  if (!melder) {
    return NextResponse.json({ error: 'Melder nicht gefunden' }, { status: 404 })
  }

  const isOwner = melder.userId === session.user.id
  const isPrivileged = session.user.role === 'ADMIN' || session.user.role === 'ORGANIZER'
  if (!isOwner && !isPrivileged) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  return NextResponse.json(melder)
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const { id } = await params
  const melder = await prisma.melder.findUnique({
    where: { id },
    include: { _count: { select: { events: true } } },
  })
  if (!melder) {
    return NextResponse.json({ error: 'Melder nicht gefunden' }, { status: 404 })
  }
  if (melder._count.events > 0) {
    return NextResponse.json(
      {
        error: `Melder ist noch mit ${melder._count.events} Veranstaltung(en) verknüpft. Bitte zuerst die Veranstaltungen anpassen oder löschen.`,
      },
      { status: 409 }
    )
  }
  await prisma.melder.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
