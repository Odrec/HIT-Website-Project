/**
 * Normalize a user-entered external URL so it can be used as `href` directly.
 *
 * Without this, values like `www.example.com` get treated as relative paths
 * by the browser and resolve to `/some/page/www.example.com`.
 *
 * Returns null for empty/whitespace-only input so callers can store NULL in
 * the database instead of an empty string.
 */
export function normalizeExternalUrl(input: string | null | undefined): string | null {
  if (input == null) return null
  const trimmed = input.trim()
  if (trimmed === '') return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  return `https://${trimmed}`
}