/**
 * Worksheet-name hygiene for ExcelJS.
 *
 * Excel names are limited to 31 characters and forbid * ? : / \ [ ].
 * `addWorksheet` throws "Worksheet name already exists" on a duplicate, which
 * is exactly how the by-Studiengang export used to fail: with 200+ programmes,
 * two names colliding within their first 31 characters is near certain.
 */

const MAX_LENGTH = 31
const FORBIDDEN = /[*?:/\\[\]]/g

export function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(FORBIDDEN, '-').trim()
  return cleaned.slice(0, MAX_LENGTH) || 'Ohne Namen'
}

/**
 * A sanitized name guaranteed free within `taken`, which is mutated to record
 * the result. Collisions get a " (2)", " (3)" … suffix that stays inside the
 * 31-character budget.
 */
export function uniqueSheetName(taken: Set<string>, name: string): string {
  const base = sanitizeSheetName(name)
  // Excel refuses "History" as a worksheet name.
  const safeBase = base.toLowerCase() === 'history' ? 'Verlauf' : base

  if (!taken.has(safeBase)) {
    taken.add(safeBase)
    return safeBase
  }

  for (let n = 2; n <= 999; n++) {
    const suffix = ` (${n})`
    const candidate = safeBase.slice(0, MAX_LENGTH - suffix.length) + suffix
    if (!taken.has(candidate)) {
      taken.add(candidate)
      return candidate
    }
  }

  // 998 collisions on one base name is not a real scenario, but never throw
  // from an export: fall back to something certainly unique.
  const fallback = `Blatt ${taken.size + 1}`.slice(0, MAX_LENGTH)
  taken.add(fallback)
  return fallback
}
