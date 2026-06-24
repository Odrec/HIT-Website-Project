import { describe, it, expect } from 'vitest'
import {
  LEHRAMT_TYP_LABELS,
  normalizeLehramtInput,
  groupLehramtPrograms,
  type LehramtProgramLike,
} from '@/lib/lehramt'

describe('normalizeLehramtInput', () => {
  it('returns empty typen and resets dependents when none given', () => {
    expect(normalizeLehramtInput({})).toEqual({
      ok: true,
      value: { lehramtTypen: [], isLehramtStudiengang: false, isBeruflicheFachrichtung: false },
    })
  })

  it('accepts and dedupes multiple Schulformen', () => {
    const result = normalizeLehramtInput({
      lehramtTypen: ['GRUND_HAUPT_REAL', 'GYMNASIUM', 'GRUND_HAUPT_REAL'],
    })
    expect(result).toEqual({
      ok: true,
      value: {
        lehramtTypen: ['GRUND_HAUPT_REAL', 'GYMNASIUM'],
        isLehramtStudiengang: false,
        isBeruflicheFachrichtung: false,
      },
    })
  })

  it('rejects an unknown Schulform', () => {
    expect(normalizeLehramtInput({ lehramtTypen: ['PRIMARSTUFE'] }).ok).toBe(false)
  })

  it('rejects Fachrichtung flag without BERUFSBILDEND', () => {
    expect(
      normalizeLehramtInput({ lehramtTypen: ['GYMNASIUM'], isBeruflicheFachrichtung: true }).ok
    ).toBe(false)
  })

  it('accepts a berufliche Fachrichtung when BERUFSBILDEND is selected', () => {
    const result = normalizeLehramtInput({
      lehramtTypen: ['BERUFSBILDEND'],
      isBeruflicheFachrichtung: true,
    })
    expect(result).toEqual({
      ok: true,
      value: {
        lehramtTypen: ['BERUFSBILDEND'],
        isLehramtStudiengang: false,
        isBeruflicheFachrichtung: true,
      },
    })
  })

  it('rejects a Lehramt-Studiengang without any Schulform', () => {
    expect(normalizeLehramtInput({ isLehramtStudiengang: true }).ok).toBe(false)
  })

  it('rejects a program that is both Lehramt-Studiengang and berufliche Fachrichtung', () => {
    expect(
      normalizeLehramtInput({
        lehramtTypen: ['BERUFSBILDEND'],
        isLehramtStudiengang: true,
        isBeruflicheFachrichtung: true,
      }).ok
    ).toBe(false)
  })
})

describe('groupLehramtPrograms', () => {
  const p = (over: Partial<LehramtProgramLike>): LehramtProgramLike => ({
    id: 'x',
    name: 'X',
    lehramtTypen: [],
    isLehramtStudiengang: false,
    isBeruflicheFachrichtung: false,
    ...over,
  })

  it('places the Lehramt-Studiengang per Schulform and lists subjects separately', () => {
    const grouped = groupLehramtPrograms([
      p({
        id: 'lg',
        name: 'Lehramt GHR',
        lehramtTypen: ['GRUND_HAUPT_REAL'],
        isLehramtStudiengang: true,
      }),
      p({ id: 'm', name: 'Mathematik', lehramtTypen: ['GRUND_HAUPT_REAL', 'GYMNASIUM'] }),
      p({ id: 'd', name: 'Deutsch', lehramtTypen: ['GRUND_HAUPT_REAL'] }),
      p({
        id: 'lgy',
        name: 'Lehramt Gym',
        lehramtTypen: ['GYMNASIUM'],
        isLehramtStudiengang: true,
      }),
    ])
    expect(grouped.ghr.lehramtStudiengang?.id).toBe('lg')
    expect(grouped.ghr.faecher.map((x) => x.name)).toEqual(['Deutsch', 'Mathematik'])
    expect(grouped.gymnasium.lehramtStudiengang?.id).toBe('lgy')
    // Mathematik (tagged GHR + Gymnasium) appears in both lists
    expect(grouped.gymnasium.faecher.map((x) => x.name)).toEqual(['Mathematik'])
  })

  it('splits Berufsschule into Studiengang, Fachrichtungen and allgemeinbildende Fächer', () => {
    const grouped = groupLehramtPrograms([
      p({
        id: 'lb',
        name: 'Lehramt BBS',
        lehramtTypen: ['BERUFSBILDEND'],
        isLehramtStudiengang: true,
      }),
      p({
        id: 'oeko',
        name: 'Ökotrophologie',
        lehramtTypen: ['BERUFSBILDEND'],
        isBeruflicheFachrichtung: true,
      }),
      p({
        id: 'elek',
        name: 'Elektrotechnik',
        lehramtTypen: ['BERUFSBILDEND'],
        isBeruflicheFachrichtung: true,
      }),
      p({ id: 'mathe', name: 'Mathematik', lehramtTypen: ['GYMNASIUM', 'BERUFSBILDEND'] }),
    ])
    expect(grouped.berufsbildend.lehramtStudiengang?.id).toBe('lb')
    expect(grouped.berufsbildend.fachrichtungen.map((x) => x.name)).toEqual([
      'Elektrotechnik',
      'Ökotrophologie',
    ])
    expect(grouped.berufsbildend.allgemeinbildend.map((x) => x.name)).toEqual(['Mathematik'])
  })

  it('ignores non-Lehramt programs and yields null Studiengänge', () => {
    const grouped = groupLehramtPrograms([p({ lehramtTypen: [] })])
    expect(grouped.ghr.lehramtStudiengang).toBeNull()
    expect(grouped.ghr.faecher).toEqual([])
    expect(grouped.berufsbildend.fachrichtungen).toEqual([])
    expect(grouped.berufsbildend.allgemeinbildend).toEqual([])
  })

  it('never lists the Lehramt-Studiengang as a subject', () => {
    const grouped = groupLehramtPrograms([
      p({
        id: 'lb',
        name: 'Lehramt BBS',
        lehramtTypen: ['BERUFSBILDEND'],
        isLehramtStudiengang: true,
      }),
    ])
    expect(grouped.berufsbildend.allgemeinbildend).toEqual([])
    expect(grouped.berufsbildend.fachrichtungen).toEqual([])
  })
})

describe('LEHRAMT_TYP_LABELS', () => {
  it('uses the official German labels', () => {
    expect(LEHRAMT_TYP_LABELS.GRUND_HAUPT_REAL).toBe('Lehramt an Grund-, Haupt- und Realschulen')
    expect(LEHRAMT_TYP_LABELS.GYMNASIUM).toBe('Lehramt an Gymnasien')
    expect(LEHRAMT_TYP_LABELS.BERUFSBILDEND).toBe('Lehramt an berufsbildenden Schulen')
  })
})
