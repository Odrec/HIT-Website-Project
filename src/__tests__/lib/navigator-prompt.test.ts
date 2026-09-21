import { describe, it, expect } from 'vitest'
import {
  buildCatalogue,
  buildNavigatorSystemPrompt,
  NAVIGATOR_GREETING,
  FIRST_QUESTION_OPTIONS,
  type CatalogueProgramInput,
} from '@/lib/navigator-prompt'

const mint = { id: 'c1', name: 'Mathematik, Informatik, Naturwissenschaften', sortOrder: 3 }
const geistes = { id: 'c2', name: 'Geistes- und Sozialwissenschaften, Sport', sortOrder: 2 }
const hsIng = { id: 'c3', name: 'Ingenieurwissenschaften', sortOrder: 1 }
const hsAgrar = {
  id: 'c4',
  name: 'Agrar- und Ernährungswissenschaften, Landschaftsarchitektur',
  sortOrder: 2,
}

const base = {
  lehramtTypen: [] as string[],
  isLehramtStudiengang: false,
  isBeruflicheFachrichtung: false,
}

const programs: CatalogueProgramInput[] = [
  {
    ...base,
    id: 'p-oeko',
    name: 'Ökotrophologie (B.Sc.)',
    institution: 'HOCHSCHULE',
    clusters: [hsAgrar],
  },
  {
    ...base,
    id: 'p-bio',
    name: 'Biologie',
    institution: 'UNI',
    clusters: [mint],
    lehramtTypen: ['GYMNASIUM', 'GRUND_HAUPT_REAL'],
  },
  { ...base, id: 'p-chem', name: 'Chemie', institution: 'UNI', clusters: [mint] },
  { ...base, id: 'p-sport', name: 'Sport', institution: 'UNI', clusters: [geistes, mint] },
  {
    ...base,
    id: 'p-elek',
    name: 'Elektrotechnik',
    institution: 'HOCHSCHULE',
    clusters: [hsIng],
    lehramtTypen: ['BERUFSBILDEND'],
    isBeruflicheFachrichtung: true,
  },
  {
    ...base,
    id: 'p-lag',
    name: 'Lehramt an Gymnasien',
    institution: 'UNI',
    clusters: [mint],
    lehramtTypen: ['GYMNASIUM'],
    isLehramtStudiengang: true,
  },
  { ...base, id: 'p-both', name: 'Studium Generale', institution: 'BOTH', clusters: [] },
]

describe('buildCatalogue', () => {
  it('assigns stable short IDs ordered UNI, HOCHSCHULE, BOTH then German name order', () => {
    const c = buildCatalogue(programs)
    expect(c.rows.map((r) => `${r.shortId}:${r.name}`)).toEqual([
      'P1:Biologie',
      'P2:Chemie',
      'P3:Lehramt an Gymnasien',
      'P4:Sport',
      'P5:Elektrotechnik',
      'P6:Ökotrophologie (B.Sc.)',
      'P7:Studium Generale',
    ])
    expect(c.byShortId.get('P6')?.id).toBe('p-oeko')
  })

  it('is order-independent on input', () => {
    const a = buildCatalogue(programs)
    const b = buildCatalogue([...programs].reverse())
    expect(b.rows.map((r) => r.shortId + r.id)).toEqual(a.rows.map((r) => r.shortId + r.id))
  })

  it('renders institutions, Studienfelder in sortOrder, and Lehramt tags', () => {
    const { text } = buildCatalogue(programs)
    const uniIdx = text.indexOf('## Universität Osnabrück')
    const hsIdx = text.indexOf('## Hochschule Osnabrück')
    const bothIdx = text.indexOf('## Hochschulübergreifend')
    expect(uniIdx).toBeGreaterThanOrEqual(0)
    expect(hsIdx).toBeGreaterThan(uniIdx)
    expect(bothIdx).toBeGreaterThan(hsIdx)
    // Studienfeld order inside Uni follows sortOrder: Geistes (2) before MINT (3)
    expect(text.indexOf('### Geistes- und Sozialwissenschaften, Sport')).toBeLessThan(
      text.indexOf('### Mathematik, Informatik, Naturwissenschaften')
    )
    expect(text).toContain(
      'P1 | Biologie | Unterrichtsfach für: Lehramt an Gymnasien, Lehramt an Grund-, Haupt- und Realschulen'
    )
    expect(text).toContain(
      'P5 | Elektrotechnik | Berufliche Fachrichtung (Lehramt an berufsbildenden Schulen)'
    )
    expect(text).toContain('P3 | Lehramt an Gymnasien | Lehramtsstudiengang')
    expect(text).toContain('P2 | Chemie\n')
  })

  it('lists a programme once per Studienfeld with the same short ID', () => {
    const { text } = buildCatalogue(programs)
    expect(text.match(/^P4 \| Sport/gm)).toHaveLength(2)
  })

  it('puts programmes without a Studienfeld under "Weitere"', () => {
    const { text } = buildCatalogue(programs)
    expect(text).toContain('### Weitere\nP7 | Studium Generale')
  })
})

describe('buildNavigatorSystemPrompt', () => {
  const c = buildCatalogue(programs)

  it('contains rules, format contract and catalogue', () => {
    const p = buildNavigatorSystemPrompt(c, { answeredQuestions: 1, phase: 'guided' })
    expect(p).toContain('OPTIONS:')
    expect(p).toContain('EMPFEHLUNG:')
    expect(p).toContain('## Universität Osnabrück')
    expect(p).toContain('Beantwortete Fragen bisher: 1')
    expect(p).not.toContain('Empfiehl JETZT')
  })

  it('tells the model to recommend now after 5 answers', () => {
    const p = buildNavigatorSystemPrompt(c, { answeredQuestions: 5, phase: 'guided' })
    expect(p).toContain('Empfiehl JETZT')
  })

  it('switches to follow-up instructions after recommendation', () => {
    const p = buildNavigatorSystemPrompt(c, { answeredQuestions: 5, phase: 'followup' })
    expect(p).toContain('Phase 3 ist aktiv')
  })
})

describe('fixed first question', () => {
  it('greeting mentions the RIASEC question and options cover six dimensions', () => {
    expect(NAVIGATOR_GREETING).toContain('Welche Art von Tätigkeiten spricht dich am meisten an?')
    expect(FIRST_QUESTION_OPTIONS).toHaveLength(6)
    expect(FIRST_QUESTION_OPTIONS[0]).toEqual({
      label: 'Praktisch arbeiten',
      description: 'z.B. Handwerk, Technik, Natur',
    })
  })
})
