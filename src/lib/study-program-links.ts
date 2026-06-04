import { normalizeExternalUrl } from '@/lib/url-utils'

export interface StudyProgramLinkInput {
  label?: unknown
  url?: unknown
  sortOrder?: unknown
}

export interface NormalizedStudyProgramLink {
  label: string
  url: string
  sortOrder: number
}

const DEFAULT_LABEL = 'Zur Studiengang-Seite'

/**
 * Turn raw link input (from the admin form / API body) into clean, ordered
 * rows ready for a Prisma nested create. Rows without a usable url are dropped;
 * blank labels fall back to the default; sortOrder is the final array index.
 */
export function normalizeLinksInput(raw: unknown): NormalizedStudyProgramLink[] {
  if (!Array.isArray(raw)) return []

  const result: NormalizedStudyProgramLink[] = []
  for (const item of raw as StudyProgramLinkInput[]) {
    const url = normalizeExternalUrl(typeof item?.url === 'string' ? item.url : '')
    if (!url) continue
    const label =
      typeof item?.label === 'string' && item.label.trim() ? item.label.trim() : DEFAULT_LABEL
    result.push({ label, url, sortOrder: result.length })
  }
  return result
}