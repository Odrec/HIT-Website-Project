import { NextResponse } from 'next/server'
import { NAVIGATOR_ENABLED } from '@/lib/features'

/**
 * 404 for the navigator APIs while the Studiennavigator is switched off (see
 * src/lib/features.ts); `null` when it is on. Checked before rate limiting so a
 * disabled navigator never reaches the model or Redis.
 */
export function navigatorDisabledResponse(): NextResponse | null {
  return NAVIGATOR_ENABLED ? null : NextResponse.json({ error: 'Not found' }, { status: 404 })
}
