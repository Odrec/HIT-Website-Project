import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { affiliationValues } from '@/lib/validations/melder'

/**
 * POST /api/melder/upsert — admin/organizer endpoint to create or update a
 * Melder identified by email. Used by the event form to persist Melder
 * fields entered for events on behalf of professors who never log in.
 *
 * Returns 201 when a new Melder was created, 200 when an existing one was
 * matched (case-insensitively by email) and updated.
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'ORGANIZER') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { firstName, lastName, title, email, phone, affiliation, fakultaet, fachbereich, room } =
    body

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !affiliation) {
    return NextResponse.json(
      { error: 'Vorname, Nachname, E-Mail und Zugehörigkeit sind erforderlich' },
      { status: 400 }
    )
  }
  if (!affiliationValues.includes(affiliation)) {
    return NextResponse.json({ error: 'Ungültige Zugehörigkeit' }, { status: 400 })
  }

  const normalizedEmail = email.trim()

  const existing = await prisma.melder.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
  })

  const data = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    title: title?.trim() || null,
    email: normalizedEmail,
    phone: phone?.trim() || null,
    affiliation,
    fakultaet: fakultaet?.trim() || null,
    fachbereich: fachbereich?.trim() || null,
    room: room?.trim() || null,
  }

  if (existing) {
    const updated = await prisma.melder.update({
      where: { id: existing.id },
      data,
    })
    return NextResponse.json(updated, { status: 200 })
  }

  const created = await prisma.melder.create({
    data: { ...data, userId: null },
  })
  return NextResponse.json(created, { status: 201 })
}
