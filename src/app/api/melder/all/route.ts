import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { compareDe } from '@/lib/sort-de'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }
  const melders = await prisma.melder.findMany({
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
      _count: { select: { events: true } },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  // Postgres runs a C collation, so order in German here (matches
  // /api/melder/options, the direct sibling of this list).
  melders.sort(
    (a, b) =>
      compareDe(a.lastName ?? '', b.lastName ?? '') ||
      compareDe(a.firstName ?? '', b.firstName ?? '')
  )

  return NextResponse.json(melders)
}
