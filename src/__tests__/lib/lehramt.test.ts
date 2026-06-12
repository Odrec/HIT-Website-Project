import { describe, it, expect } from 'vitest'
import {
  LEHRAMT_TYP_LABELS,
  normalizeLehramtInput,
  groupLehramtPrograms,
  type LehramtProgramLike,
} from '@/lib/lehramt'

describe('normalizeLehramtInput', () => {
  it('returns null typ and resets dependents when lehramtTyp is missing', () => {
    expect(normalizeLehramtInput({})).toEqual({
      ok: true,
      value: { lehramtTyp: null, isBeruflicheFachrichtung: false, unterrichtsfachIds: [] },
    })
  })

  it('rejects an unknown lehramtTyp', () => {
    const result = normalizeLehramtInput({ lehramtTyp: 'PRIMARSTUFE' })
    expect(result.ok).toBe(false)
  })

  it('rejects Fachrichtung flag without BERUFSBILDEND', () => {
    const result = normalizeLehramtInput({
      lehramtTyp: 'GYMNASIUM',
      isBeruflicheFachrichtung: true,
    })
    expect(result.ok).toBe(false)
  })

  it('rejects Unterrichtsfächer without Fachrichtung flag', () => {
    const result = normalizeLehramtInput({
      lehramtTyp: 'BERUFSBILDEND',
      isBeruflicheFachrichtung: false,
      unterrichtsfachIds: ['a'],
    })
    expect(result.ok).toBe(false)
  })

  it('accepts a Fachrichtung, dedupes ids and drops self-reference', () => {
    const result = normalizeLehramtInput(
      {
        lehramtTyp: 'BERUFSBILDEND',
        isBeruflicheFachrichtung: true,
        unterrichtsfachIds: ['a', 'a', 'self', '', 42],
      },
      'self'
    )
    expect(result).toEqual({
      ok: true,
      value: {
        lehramtTyp: 'BERUFSBILDEND',
        isBeruflicheFachrichtung: true,
        unterrichtsfachIds: ['a'],
      },
    })
  })
})

describe('groupLehramtPrograms', () => {
  const p = (over: Partial<LehramtProgramLike>): LehramtProgramLike => ({
    id: 'x',
    name: 'X',
    lehramtTyp: null,
    isBeruflicheFachrichtung: false,
    ...over,
  })

  it('groups by typ, splits BBS into general and Fachrichtungen, sorts by name', () => {
    const grouped = groupLehramtPrograms([
      p({ id: '1', name: 'Zeta', lehramtTyp: 'GRUND_HAUPT_REAL' }),
      p({ id: '2', name: 'Alpha', lehramtTyp: 'GRUND_HAUPT_REAL' }),
      p({ id: '3', name: 'Gym', lehramtTyp: 'GYMNASIUM' }),
      p({ id: '4', name: 'BBS allgemein', lehramtTyp: 'BERUFSBILDEND' }),
      p({
        id: '5',
        name: 'Ökotrophologie',
        lehramtTyp: 'BERUFSBILDEND',
        isBeruflicheFachrichtung: true,
      }),
      p({
        id: '6',
        name: 'Elektrotechnik',
        lehramtTyp: 'BERUFSBILDEND',
        isBeruflicheFachrichtung: true,
      }),
    ])
    expect(grouped.ghr.map((x) => x.name)).toEqual(['Alpha', 'Zeta'])
    expect(grouped.gymnasium.map((x) => x.name)).toEqual(['Gym'])
    expect(grouped.bbsGeneral.map((x) => x.name)).toEqual(['BBS allgemein'])
    expect(grouped.fachrichtungen.map((x) => x.name)).toEqual(['Elektrotechnik', 'Ökotrophologie'])
  })

  it('ignores non-Lehramt programs', () => {
    const grouped = groupLehramtPrograms([p({ lehramtTyp: null })])
    expect(grouped.ghr).toEqual([])
    expect(grouped.gymnasium).toEqual([])
    expect(grouped.bbsGeneral).toEqual([])
    expect(grouped.fachrichtungen).toEqual([])
  })
})

describe('LEHRAMT_TYP_LABELS', () => {
  it('uses the official German labels', () => {
    expect(LEHRAMT_TYP_LABELS.GRUND_HAUPT_REAL).toBe('Lehramt an Grund-, Haupt- und Realschulen')
    expect(LEHRAMT_TYP_LABELS.GYMNASIUM).toBe('Lehramt an Gymnasien')
    expect(LEHRAMT_TYP_LABELS.BERUFSBILDEND).toBe('Lehramt an berufsbildenden Schulen')
  })
})
