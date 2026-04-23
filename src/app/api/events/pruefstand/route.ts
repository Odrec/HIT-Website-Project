import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { eventService } from '@/services'

const VALID_STATUSES = new Set(['DRAFT_FROM_ROLLOVER', 'NEEDS_REVIEW'])

/**
 * GET /api/events/pruefstand
 *
 * Lists events awaiting admin review in the active edition. Supports
 * optional `reviewStatus` (DRAFT_FROM_ROLLOVER | NEEDS_REVIEW) and `search`
 * query parameters. Admin-only.
 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const rawStatus = searchParams.get('reviewStatus')
  const reviewStatus =
    rawStatus && VALID_STATUSES.has(rawStatus)
      ? (rawStatus as 'DRAFT_FROM_ROLLOVER' | 'NEEDS_REVIEW')
      : undefined
  const search = searchParams.get('search') || undefined

  const events = await eventService.listPruefstand({
    ...(reviewStatus && { reviewStatus }),
    ...(search && { search }),
  })
  return NextResponse.json(events)
}