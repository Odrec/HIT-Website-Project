import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { eventService } from '@/services'

/**
 * POST /api/events/[id]/publish
 *
 * Flips an event's reviewStatus to PUBLISHED, removing it from the
 * Prüfstand queue and making it visible to public consumers. Admin-only.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }
  const { id } = await params
  try {
    await eventService.publish(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to publish'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
