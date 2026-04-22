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
