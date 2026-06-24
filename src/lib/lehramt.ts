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
  lehramtTypen: LehramtTypValue[]
  isLehramtStudiengang: boolean
  isBeruflicheFachrichtung: boolean
}

export type LehramtInputResult =
  | { ok: true; value: NormalizedLehramtInput }
  | { ok: false; error: string }

export function normalizeLehramtInput(body: {
  lehramtTypen?: unknown
  isLehramtStudiengang?: unknown
  isBeruflicheFachrichtung?: unknown
}): LehramtInputResult {
  const rawTypen = Array.isArray(body.lehramtTypen) ? body.lehramtTypen : []
  const lehramtTypen = [
    ...new Set(rawTypen.filter((v): v is LehramtTypValue => typeof v === 'string')),
  ]
  for (const typ of lehramtTypen) {
    if (!LEHRAMT_TYP_VALUES.includes(typ)) {
      return { ok: false, error: 'Ungültige Schulform' }
    }
  }

  const isLehramtStudiengang = body.isLehramtStudiengang === true
  const isBeruflicheFachrichtung = body.isBeruflicheFachrichtung === true

  if ((isLehramtStudiengang || isBeruflicheFachrichtung) && lehramtTypen.length === 0) {
    return { ok: false, error: 'Bitte mindestens eine Schulform auswählen' }
  }

  if (isBeruflicheFachrichtung && !lehramtTypen.includes('BERUFSBILDEND')) {
    return {
      ok: false,
      error: 'Berufliche Fachrichtung erfordert Lehramt an berufsbildenden Schulen',
    }
  }

  if (isLehramtStudiengang && isBeruflicheFachrichtung) {
    return {
      ok: false,
      error: 'Ein Lehramts-Studiengang kann keine berufliche Fachrichtung sein',
    }
  }

  return { ok: true, value: { lehramtTypen, isLehramtStudiengang, isBeruflicheFachrichtung } }
}

export interface LehramtProgramLike {
  id: string
  name: string
  lehramtTypen: LehramtTypValue[]
  isLehramtStudiengang: boolean
  isBeruflicheFachrichtung: boolean
}

/** GHR / Gymnasium: the dedicated Lehramt-Studiengang plus its Unterrichtsfächer. */
export interface SchulformGroup<T> {
  lehramtStudiengang: T | null
  faecher: T[]
}

/** Berufsschullehramt: Studiengang, berufliche Fachrichtungen, allgemeinbildende Fächer. */
export interface BerufsschulGroup<T> {
  lehramtStudiengang: T | null
  fachrichtungen: T[]
  allgemeinbildend: T[]
}

export interface GroupedLehramtPrograms<T extends LehramtProgramLike> {
  ghr: SchulformGroup<T>
  gymnasium: SchulformGroup<T>
  berufsbildend: BerufsschulGroup<T>
}

export function groupLehramtPrograms<T extends LehramtProgramLike>(
  programs: T[]
): GroupedLehramtPrograms<T> {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, 'de')
  const has = (p: T, typ: LehramtTypValue) => p.lehramtTypen.includes(typ)

  // The dedicated Lehramt-Studiengang for a Schulform; deterministic if an admin
  // mistakenly flags more than one (picks the first by name).
  const studiengang = (typ: LehramtTypValue): T | null =>
    programs.filter((p) => p.isLehramtStudiengang && has(p, typ)).sort(byName)[0] ?? null

  // Unterrichtsfächer for an allgemeinbildende Schulform (never the Studiengang).
  const faecher = (typ: LehramtTypValue): T[] =>
    programs.filter((p) => has(p, typ) && !p.isLehramtStudiengang).sort(byName)

  return {
    ghr: {
      lehramtStudiengang: studiengang('GRUND_HAUPT_REAL'),
      faecher: faecher('GRUND_HAUPT_REAL'),
    },
    gymnasium: {
      lehramtStudiengang: studiengang('GYMNASIUM'),
      faecher: faecher('GYMNASIUM'),
    },
    berufsbildend: {
      lehramtStudiengang: studiengang('BERUFSBILDEND'),
      fachrichtungen: programs
        .filter(
          (p) => has(p, 'BERUFSBILDEND') && p.isBeruflicheFachrichtung && !p.isLehramtStudiengang
        )
        .sort(byName),
      allgemeinbildend: programs
        .filter(
          (p) => has(p, 'BERUFSBILDEND') && !p.isBeruflicheFachrichtung && !p.isLehramtStudiengang
        )
        .sort(byName),
    },
  }
}
