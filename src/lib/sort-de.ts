/**
 * German alphabetical sorting (DIN 5007-1).
 *
 * The database runs on postgres:16-alpine (musl libc, `C` collation), so every
 * Prisma `orderBy: { name: 'asc' }` compares raw bytes and places Ö after Z.
 * Alphabetical order is therefore decided in application code, not by the
 * database — always sort user-visible name lists through these helpers.
 */

// Created once: constructing an Intl.Collator per comparison is expensive.
const collator = new Intl.Collator('de-DE', { numeric: true })

/** Compare two strings in German order. Ä/Ö/Ü sort with A/O/U, not after Z. */
export function compareDe(a: string, b: string): number {
  return collator.compare(a, b)
}

/** Build a comparator for objects, keyed on a string field. */
export function compareDeBy<T>(selector: (item: T) => string): (a: T, b: T) => number {
  return (a, b) => collator.compare(selector(a), selector(b))
}

/**
 * The A–Z index bucket for a name: umlauts fold onto their base letter, so
 * "Ökotrophologie" belongs under O rather than in its own Ö section. Anything
 * not starting with a letter goes under '#'.
 */
export function azLetter(name: string): string {
  const raw = name.trim().charAt(0)
  if (!raw) return '#'
  const folded =
    raw === 'ß'
      ? 'S'
      : raw
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .toUpperCase()
  return /^[A-Z]$/.test(folded) ? folded : '#'
}
