import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventIds } = body

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { error: 'eventIds array is required' },
        { status: 400 }
      )
    }

    // Sort for consistent dedup
    const sortedIds = [...eventIds].sort()

    // Check for existing shared schedule with same events
    const existing = await prisma.sharedSchedule.findFirst({
      where: { eventIds: { equals: sortedIds } },
    })

    if (existing) {
      const url = `${new URL(request.url).origin}/s/${existing.code}`
      return NextResponse.json({ code: existing.code, url })
    }

    // Create new shared schedule
    const code = nanoid(6)
    const shared = await prisma.sharedSchedule.create({
      data: { code, eventIds: sortedIds },
    })

    const url = `${new URL(request.url).origin}/s/${shared.code}`
    return NextResponse.json({ code: shared.code, url })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create shared schedule' },
      { status: 500 }
    )
  }
}
