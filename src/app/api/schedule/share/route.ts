import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { nanoid } from 'nanoid'
import { getActiveEditionId } from '@/lib/active-edition'

function getPublicOrigin(request: NextRequest): string {
  const configured = process.env.NEXTAUTH_URL
  if (configured) return configured.replace(/\/$/, '')

  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) {
    const proto = request.headers.get('x-forwarded-proto') ?? 'https'
    return `${proto}://${forwardedHost}`
  }

  return new URL(request.url).origin
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventIds } = body

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ error: 'eventIds array is required' }, { status: 400 })
    }

    const sortedIds = [...eventIds].sort()
    const origin = getPublicOrigin(request)
    const editionId = await getActiveEditionId()

    const existing = await prisma.sharedSchedule.findFirst({
      where: { eventIds: { equals: sortedIds }, editionId },
    })

    if (existing) {
      return NextResponse.json({ code: existing.code, url: `${origin}/s/${existing.code}` })
    }

    const code = nanoid(6)
    const shared = await prisma.sharedSchedule.create({
      data: { code, eventIds: sortedIds, editionId },
    })

    return NextResponse.json({ code: shared.code, url: `${origin}/s/${shared.code}` })
  } catch {
    return NextResponse.json({ error: 'Failed to create shared schedule' }, { status: 500 })
  }
}
