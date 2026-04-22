import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { affiliationValues } from '@/lib/validations/melder'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }
  const melder = await prisma.melder.findUnique({ where: { userId: session.user.id } })
  return NextResponse.json(melder)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }
  const body = await request.json()
  const { firstName, lastName, title, email, phone, affiliation, fakultaet, fachbereich, room } =
    body

  if (!firstName || !lastName || !email || !affiliation) {
    return NextResponse.json(
      { error: 'Vorname, Nachname, E-Mail und Zugehörigkeit sind erforderlich' },
      { status: 400 }
    )
  }
  if (!affiliationValues.includes(affiliation)) {
    return NextResponse.json({ error: 'Ungültige Zugehörigkeit' }, { status: 400 })
  }

  const melder = await prisma.melder.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      title: title?.trim() || null,
      email: email.trim(),
      phone: phone?.trim() || null,
      affiliation,
      fakultaet: fakultaet?.trim() || null,
      fachbereich: fachbereich?.trim() || null,
      room: room?.trim() || null,
    },
    update: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      title: title?.trim() || null,
      email: email.trim(),
      phone: phone?.trim() || null,
      affiliation,
      fakultaet: fakultaet?.trim() || null,
      fachbereich: fachbereich?.trim() || null,
      room: room?.trim() || null,
    },
  })
  return NextResponse.json(melder)
}
