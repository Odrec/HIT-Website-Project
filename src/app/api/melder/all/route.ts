import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

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
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(melders)
}
