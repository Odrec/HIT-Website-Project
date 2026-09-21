// Pure parser for Studiennavigator model replies. The model ends a reply with
// at most one machine-readable trailer line: `OPTIONS: [...]` while asking a
// question, or `EMPFEHLUNG: {...}` when recommending programmes. Everything
// before that line is visitor-facing text.

export interface NavigatorOption {
  label: string
  description?: string
}

export interface ParsedRecommendation {
  programs: { id: string; reason: string }[]
  summary: string
}

export interface ParsedNavigatorReply {
  text: string
  options?: NavigatorOption[]
  recommendation?: ParsedRecommendation
}

const TRAILER_RE = /^\s*\**\s*(OPTIONS|EMPFEHLUNG)\s*:?\**\s*:?\s*(.*)$/i

function stripFences(lines: string[]): string[] {
  return lines.filter((l) => !/^\s*```/.test(l))
}

function parseOptions(raw: unknown): NavigatorOption[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: NavigatorOption[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      out.push({ label: item.trim() })
    } else if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>
      const label = typeof o.option === 'string' ? o.option.trim() : ''
      if (!label) continue
      const description = typeof o.description === 'string' ? o.description.trim() : undefined
      out.push(description ? { label, description } : { label })
    }
  }
  return out.length > 0 ? out : undefined
}

function parseRecommendation(raw: unknown): ParsedRecommendation | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const list = Array.isArray(o.programs) ? o.programs : []
  const programs: { id: string; reason: string }[] = []
  for (const p of list) {
    if (!p || typeof p !== 'object') continue
    const rec = p as Record<string, unknown>
    if (typeof rec.id !== 'string' || !rec.id.trim()) continue
    programs.push({
      id: rec.id.trim(),
      reason: typeof rec.reason === 'string' ? rec.reason.trim() : '',
    })
  }
  return {
    programs,
    summary: typeof o.summary === 'string' ? o.summary.trim() : '',
  }
}

export function parseNavigatorReply(content: string): ParsedNavigatorReply {
  const lines = stripFences(content.replace(/\r\n/g, '\n').split('\n'))
  // find last non-empty line
  let idx = lines.length - 1
  while (idx >= 0 && lines[idx].trim() === '') idx--
  if (idx < 0) return { text: '' }

  const match = lines[idx].match(TRAILER_RE)
  if (!match) return { text: lines.join('\n').trim() }

  const keyword = match[1].toUpperCase()
  const payload = match[2].trim()
  const text = lines.slice(0, idx).join('\n').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch {
    console.warn('[navigator] malformed trailer JSON:', payload.slice(0, 200))
    return { text }
  }

  if (keyword === 'OPTIONS') {
    const options = parseOptions(parsed)
    return options ? { text, options } : { text }
  }
  const recommendation = parseRecommendation(parsed)
  return recommendation ? { text, recommendation } : { text }
}
