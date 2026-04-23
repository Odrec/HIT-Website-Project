import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    const shared = await prisma.sharedSchedule.findUnique({
      where: { code },
    })

    if (!shared) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    const edition = await prisma.hitEdition.findUnique({
      where: { id: shared.editionId },
      select: { year: true },
    })

    return NextResponse.json({
      eventIds: shared.eventIds,
      editionId: shared.editionId,
      editionYear: edition?.year ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load shared schedule' }, { status: 500 })
  }
}