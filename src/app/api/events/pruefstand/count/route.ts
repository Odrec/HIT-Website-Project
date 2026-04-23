import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { eventService } from '@/services'

/**
 * GET /api/events/pruefstand/count
 *
 * Returns the number of events awaiting admin review in the active edition.
 * Used to render the badge in the admin nav. Admin-only.
 */
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }
  const count = await eventService.countPruefstand()
  return NextResponse.json({ count })
}