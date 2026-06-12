// Lehramt Binnendifferenzierung — shared constants and pure helpers.
// Used by the study-programs API (input validation), the admin form and
// the public /events/lehramt page (grouping).

export const LEHRAMT_TYP_VALUES = ['GRUND_HAUPT_REAL', 'GYMNASIUM', 'BERUFSBILDEND'] as const
export type LehramtTypValue = (typeof LEHRAMT_TYP_VALUES)[number]

export const LEHRAMT_TYP_LABELS: Record<LehramtTypValue, string> = {
  GRUND_HAUPT_REAL: 'Lehramt an Grund-, Haupt- und Realschulen',
  GYMNASIUM: 'Lehramt an Gymnasien',
  BERUFSBILDEND: 'Lehramt an berufsbildenden Schulen',
}

export interface NormalizedLehramtInput {
  lehramtTyp: LehramtTypValue | null
  isBeruflicheFachrichtung: boolean
  unterrichtsfachIds: string[]
}

export type LehramtInputResult =
  | { ok: true; value: NormalizedLehramtInput }
  | { ok: false; error: string }

export function normalizeLehramtInput(
  body: {
    lehramtTyp?: unknown
    isBeruflicheFachrichtung?: unknown
    unterrichtsfachIds?: unknown
  },
  selfId?: string
): LehramtInputResult {
  const rawTyp = body.lehramtTyp
  if (rawTyp === undefined || rawTyp === null || rawTyp === '') {
    if (body.isBeruflicheFachrichtung === true) {
      return {
        ok: false,
        error: 'Berufliche Fachrichtung erfordert Lehramt an berufsbildenden Schulen',
      }
    }
    return {
      ok: true,
      value: { lehramtTyp: null, isBeruflicheFachrichtung: false, unterrichtsfachIds: [] },
    }
  }

  if (!LEHRAMT_TYP_VALUES.includes(rawTyp as LehramtTypValue)) {
    return { ok: false, error: 'Ungültiger Lehramt-Typ' }
  }
  const lehramtTyp = rawTyp as LehramtTypValue

  const isFachrichtung = body.isBeruflicheFachrichtung === true
  if (isFachrichtung && lehramtTyp !== 'BERUFSBILDEND') {
    return {
      ok: false,
      error: 'Berufliche Fachrichtung erfordert Lehramt an berufsbildenden Schulen',
    }
  }

  const rawIds = Array.isArray(body.unterrichtsfachIds) ? body.unterrichtsfachIds : []
  const unterrichtsfachIds = [
    ...new Set(
      rawIds.filter((v): v is string => typeof v === 'string' && v.length > 0 && v !== selfId)
    ),
  ]
  if (unterrichtsfachIds.length > 0 && !isFachrichtung) {
    return {
      ok: false,
      error: 'Unterrichtsfächer können nur einer beruflichen Fachrichtung zugeordnet werden',
    }
  }

  return {
    ok: true,
    value: { lehramtTyp, isBeruflicheFachrichtung: isFachrichtung, unterrichtsfachIds },
  }
}

export interface LehramtProgramLike {
  id: string
  name: string
  lehramtTyp: LehramtTypValue | null
  isBeruflicheFachrichtung: boolean
}

export interface GroupedLehramtPrograms<T extends LehramtProgramLike> {
  ghr: T[]
  gymnasium: T[]
  bbsGeneral: T[]
  fachrichtungen: T[]
}

export function groupLehramtPrograms<T extends LehramtProgramLike>(
  programs: T[]
): GroupedLehramtPrograms<T> {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, 'de')
  return {
    ghr: programs.filter((p) => p.lehramtTyp === 'GRUND_HAUPT_REAL').sort(byName),
    gymnasium: programs.filter((p) => p.lehramtTyp === 'GYMNASIUM').sort(byName),
    bbsGeneral: programs
      .filter((p) => p.lehramtTyp === 'BERUFSBILDEND' && !p.isBeruflicheFachrichtung)
      .sort(byName),
    fachrichtungen: programs
      .filter((p) => p.lehramtTyp === 'BERUFSBILDEND' && p.isBeruflicheFachrichtung)
      .sort(byName),
  }
}
