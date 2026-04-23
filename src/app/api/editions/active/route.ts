import { NextResponse } from 'next/server'
import { getActiveEdition } from '@/lib/active-edition'

// Public: returns the currently ACTIVE edition. Used by public pages
// (event form, schedule) to read hitDate and submission deadline info.
export async function GET() {
  try {
    const edition = await getActiveEdition()
    return NextResponse.json(edition)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load active edition'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
