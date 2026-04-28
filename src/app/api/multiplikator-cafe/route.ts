import { NextResponse } from 'next/server'
import { getActiveEdition } from '@/lib/active-edition'

export async function GET() {
  const edition = await getActiveEdition()
  return NextResponse.json({ eventId: edition.multiplikatorCafeEventId ?? null })
}
