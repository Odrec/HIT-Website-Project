import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { compareDe } from '@/lib/sort-de'

/**
 * GET /api/melder/options — slim Melder list for the event form's
 * "Bestehende Melder*in übernehmen" picker.
 *
 * ADMIN only. Organizers are external submitters, so letting them browse every
 * Melder's contact data would be a Datenschutz problem; they keep the
 * auto-filled own profile instead. Enforced here, not just by hiding the UI.
 */
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const melders = await prisma.melder.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: true,
      email: true,
      phone: true,
      affiliation: true,
      organisationseinheit: true,
      room: true,
      adresse: true,
    },
  })

  // Postgres runs a C collation, so order in German here.
  melders.sort(
    (a, b) =>
      compareDe(a.lastName ?? '', b.lastName ?? '') ||
      compareDe(a.firstName ?? '', b.firstName ?? '')
  )

  return NextResponse.json(melders)
}
