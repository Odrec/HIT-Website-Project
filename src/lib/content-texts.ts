import { cache } from 'react'
import { prisma } from '@/lib/db/prisma'
import { CONTENT_DEFAULTS } from '@/lib/content-slots'

/**
 * Merge DB overrides over the shipped defaults. Blank overrides and keys that
 * are no longer slots are ignored, so a slot can never render empty and a
 * removed slot cannot resurrect stale text.
 */
export function mergeContentTexts(
  overrides: Array<{ key: string; value: string }>
): Record<string, string> {
  const merged = { ...CONTENT_DEFAULTS }
  for (const { key, value } of overrides) {
    if (!(key in CONTENT_DEFAULTS)) continue
    if (!value?.trim()) continue
    merged[key] = value
  }
  return merged
}

/** All slot values for the current request. Server-only. */
export const getContentTexts = cache(async (): Promise<Record<string, string>> => {
  try {
    const rows = await prisma.contentText.findMany({ select: { key: true, value: true } })
    return mergeContentTexts(rows)
  } catch (error) {
    // A content-table problem must never take the homepage down.
    console.error('Error loading content texts:', error)
    return { ...CONTENT_DEFAULTS }
  }
})
