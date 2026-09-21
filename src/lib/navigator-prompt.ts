// Pure helpers for the Studiennavigator system prompt. The catalogue is built
// from DB-shaped StudyProgram records (with clusters) and rendered into the
// prompt so the model can pick programmes by short ID (P1..Pn).

import { compareDe } from '@/lib/sort-de'
import { LEHRAMT_TYP_LABELS, type LehramtTypValue } from '@/lib/lehramt'
import type { NavigatorOption } from '@/lib/navigator-reply'

export interface CatalogueProgramInput {
  id: string
  name: string
  institution: 'UNI' | 'HOCHSCHULE' | 'BOTH'
  lehramtTypen: string[]
  isLehramtStudiengang: boolean
  isBeruflicheFachrichtung: boolean
  clusters: { id: string; name: string; sortOrder: number }[]
}

export interface CatalogueRow extends CatalogueProgramInput {
  shortId: string
}

export interface NavigatorCatalogue {
  rows: CatalogueRow[]
  byShortId: Map<string, CatalogueRow>
  text: string
}

// UNI-first, matches study-program-service.ts (Postgres enum order).
export const INSTITUTION_RANK: Record<string, number> = { UNI: 0, HOCHSCHULE: 1, BOTH: 2 }

const INSTITUTION_HEADING: Record<string, string> = {
  UNI: 'Universität Osnabrück',
  HOCHSCHULE: 'Hochschule Osnabrück',
  BOTH: 'Hochschulübergreifend',
}

function lehramtTag(row: CatalogueRow): string {
  if (row.isLehramtStudiengang) return 'Lehramtsstudiengang'
  if (row.isBeruflicheFachrichtung) {
    return `Berufliche Fachrichtung (${LEHRAMT_TYP_LABELS.BERUFSBILDEND})`
  }
  if (row.lehramtTypen.length > 0) {
    const labels = row.lehramtTypen
      .filter((t): t is LehramtTypValue => t in LEHRAMT_TYP_LABELS)
      .map((t) => LEHRAMT_TYP_LABELS[t])
    if (labels.length > 0) return `Unterrichtsfach für: ${labels.join(', ')}`
  }
  return ''
}

function renderLine(row: CatalogueRow): string {
  const tag = lehramtTag(row)
  return tag ? `${row.shortId} | ${row.name} | ${tag}` : `${row.shortId} | ${row.name}`
}

export function buildCatalogue(programs: CatalogueProgramInput[]): NavigatorCatalogue {
  const sorted = [...programs].sort(
    (a, b) =>
      (INSTITUTION_RANK[a.institution] ?? 9) - (INSTITUTION_RANK[b.institution] ?? 9) ||
      compareDe(a.name, b.name) ||
      a.id.localeCompare(b.id)
  )
  const rows: CatalogueRow[] = sorted.map((p, i) => ({ ...p, shortId: `P${i + 1}` }))
  const byShortId = new Map(rows.map((r) => [r.shortId, r]))

  const parts: string[] = []
  for (const inst of ['UNI', 'HOCHSCHULE', 'BOTH']) {
    const instRows = rows.filter((r) => r.institution === inst)
    if (instRows.length === 0) continue
    parts.push(`## ${INSTITUTION_HEADING[inst]}`)

    const clusterMap = new Map<string, { name: string; sortOrder: number; rows: CatalogueRow[] }>()
    const uncategorised: CatalogueRow[] = []
    for (const r of instRows) {
      if (r.clusters.length === 0) {
        uncategorised.push(r)
        continue
      }
      for (const c of r.clusters) {
        const entry = clusterMap.get(c.id) ?? { name: c.name, sortOrder: c.sortOrder, rows: [] }
        entry.rows.push(r)
        clusterMap.set(c.id, entry)
      }
    }
    const clusters = [...clusterMap.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder || compareDe(a.name, b.name)
    )
    for (const c of clusters) {
      parts.push(`### ${c.name}`)
      for (const r of c.rows) parts.push(renderLine(r))
    }
    if (uncategorised.length > 0) {
      parts.push('### Weitere')
      for (const r of uncategorised) parts.push(renderLine(r))
    }
    parts.push('')
  }

  return { rows, byShortId, text: parts.join('\n').trim() + '\n' }
}

export const FIRST_QUESTION_OPTIONS: NavigatorOption[] = [
  { label: 'Praktisch arbeiten', description: 'z.B. Handwerk, Technik, Natur' },
  { label: 'Forschen & Analysieren', description: 'z.B. Wissenschaft, IT, Theorien' },
  { label: 'Kreativ sein', description: 'z.B. Kunst, Design, Sprachen' },
  { label: 'Menschen helfen', description: 'z.B. Soziales, Unterrichten, Beraten' },
  { label: 'Führen & Überzeugen', description: 'z.B. Wirtschaft, Management, Recht' },
  { label: 'Organisieren & Verwalten', description: 'z.B. Daten, Finanzen, Planung' },
]

export const NAVIGATOR_GREETING = `Hi! Ich bin der Studiennavigator des Hochschulinformationstags. In vier bis fünf kurzen Fragen finden wir heraus, welche Studiengänge der Universität und der Hochschule Osnabrück zu dir passen könnten – und welche Veranstaltungen am HIT sich für dich lohnen.

Los geht's: Welche Art von Tätigkeiten spricht dich am meisten an? Du kannst auch mehrere Optionen nennen oder einfach frei schreiben.`

const RULES = `Du bist der Studiennavigator des Hochschulinformationstags (HIT) in Osnabrück. Du hilfst Schüler*innen und Studieninteressierten (16 bis 24 Jahre) herauszufinden, welche Studiengänge der Universität Osnabrück und der Hochschule Osnabrück zu ihnen passen könnten, damit sie am HIT die richtigen Veranstaltungen besuchen.

ANSPRACHE
- Immer "du", "dir", "dein". Niemals "Sie", "Ihnen", "Ihr" als Anrede.
- Freundlich, klar, auf Augenhöhe. Keine erzwungene Jugendsprache.
- Kurz: höchstens drei Sätze vor einer Frage.
- Antworte immer auf Deutsch.

ABLAUF
Phase 1 – Fragen (4 bis 5 Fragen insgesamt, eine pro Nachricht)
- Die erste Frage (Tätigkeitsbereiche nach dem RIASEC-Modell) wurde bereits gestellt; die erste Antwort des Nutzers bezieht sich darauf.
- Frage nach Interessen, Eigenschaften und Zielen, nicht direkt nach Fächern. Beziehe dich auf frühere Antworten und stelle keine Frage doppelt.
- Kläre in einer Frage, ob eine Tätigkeit als Lehrer*in vorstellbar ist. Bei Interesse fragst du als nächstes nach der Schulform: Grund-, Haupt- und Realschule / Gymnasium / berufsbildende Schulen.
- Kläre, falls noch offen, ob eher forschungsorientiert (Universität) oder praxisnah (Hochschule) studiert werden soll, oder ob das egal ist.
- Wenn die Richtung früh klar ist, nutze die restlichen Fragen, um ähnliche Studiengänge voneinander abzugrenzen.
- Jede Frage endet mit einer OPTIONS-Zeile mit 3 bis 5 Optionen. Der Nutzer kann auch frei antworten.

Phase 2 – Empfehlung
- Nach der 4. oder 5. Antwort empfiehlst du 3 bis 5 Studiengänge aus dem Katalog unten.
- Schreibe zwei Sätze Einleitung, dann pro Studiengang den Namen fett und einen Satz zur Passung. Nenne bei jedem Studiengang die Hochschule (Universität oder Hochschule Osnabrück).
- Verwende ausschließlich Studiengänge aus dem Katalog und ihre IDs. Erfinde nichts.
- Lehramt: Empfiehl die passenden Unterrichtsfächer bzw. beruflichen Fachrichtungen der gewählten Schulform (siehe Tags im Katalog) und weise darauf hin, dass die Kombinationsregeln auf der Lehramt-Seite des HIT stehen.
- Beende die Nachricht mit einer EMPFEHLUNG-Zeile.

Phase 3 – Rückfragen
- Danach beantwortest du Fragen des Nutzers frei und konkret. Keine OPTIONS-Zeile mehr.
- Wenn du deine Empfehlung änderst oder ergänzt, sende erneut eine vollständige EMPFEHLUNG-Zeile mit allen empfohlenen Studiengängen. Sonst keine.

FORMAT (strikt einhalten)
- Normaler Text, Markdown nur für **fett**.
- Höchstens EINE Steuerzeile, immer als letzte Zeile, ohne Codeblock, ohne Fettdruck, in einer einzigen Zeile mit gültigem JSON (doppelte Anführungszeichen):
  OPTIONS: [{"option":"Kurzer Text","description":"optionale Erklärung"}, ...]
  EMPFEHLUNG: {"programs":[{"id":"P12","reason":"Ein Satz zur Passung"}],"summary":"Zwei Sätze Zusammenfassung"}
- Die IDs in EMPFEHLUNG sind die Katalog-IDs (z.B. P12).`

export function buildNavigatorSystemPrompt(
  catalogue: NavigatorCatalogue,
  state: { answeredQuestions: number; phase: 'guided' | 'followup' }
): string {
  let status: string
  if (state.phase === 'followup') {
    status =
      'Phase 3 ist aktiv: Die Empfehlung wurde bereits gegeben. Beantworte Rückfragen, keine OPTIONS mehr. Sende nur bei einer geänderten Empfehlung erneut eine EMPFEHLUNG-Zeile.'
  } else if (state.answeredQuestions >= 5) {
    status = 'Empfiehl JETZT: Beende Phase 1 und gib die Empfehlung mit EMPFEHLUNG-Zeile.'
  } else if (state.answeredQuestions >= 4) {
    status =
      'Du hast fast genug Informationen. Stelle höchstens noch eine Frage oder gib jetzt die Empfehlung.'
  } else {
    status = 'Stelle die nächste Frage (Phase 1).'
  }

  return `${RULES}

STATUS
- Beantwortete Fragen bisher: ${state.answeredQuestions}
- ${status}

KATALOG DER STUDIENGÄNGE AM HIT
${catalogue.text}`
}
