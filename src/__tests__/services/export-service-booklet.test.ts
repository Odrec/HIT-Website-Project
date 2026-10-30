import { describe, it, expect } from 'vitest'
import {
  groupEventsForBooklet,
  groupInfoMarketsForBooklet,
  groupLehramtEventsForBooklet,
} from '@/services/export-service'
import { groupLehramtPrograms, type LehramtTypValue } from '@/lib/lehramt'

type Cluster = { name: string; institution: 'UNI' | 'HOCHSCHULE' | 'BOTH'; sortOrder: number }

const ev = (
  id: string,
  opts: {
    title?: string
    cross?: boolean
    time?: string | null
    clusters?: Cluster[]
    programIds?: string[]
  } = {}
) => ({
  id,
  title: opts.title ?? id,
  isCrossProgram: opts.cross ?? false,
  timeStart: 'time' in opts ? (opts.time as string | null) : '2026-11-19T09:00',
  studyPrograms: [
    ...(opts.clusters ?? []).map((c) => ({
      studyProgram: { id: `sp-${c.institution}-${c.name}`, clusters: [c] },
    })),
    ...(opts.programIds ?? []).map((pid) => ({ studyProgram: { id: pid, clusters: [] } })),
  ],
})

const uni = (name: string, sortOrder: number) => ({ name, institution: 'UNI' as const, sortOrder })
const hs = (name: string, sortOrder: number) => ({
  name,
  institution: 'HOCHSCHULE' as const,
  sortOrder,
})

describe('groupEventsForBooklet', () => {
  it('separates cross-program events', () => {
    const c = ev('c', { cross: true })
    const n = ev('n', { clusters: [uni('Feld', 0)] })
    const res = groupEventsForBooklet([c, n])
    expect(res.crossProgram.map((e) => e.id)).toEqual(['c'])
    expect(res.clusterGroups.flatMap((g) => g.events.map((e) => e.id))).toEqual(['n'])
  })

  it('orders groups Hochschule before Universität', () => {
    const u = ev('u', { clusters: [uni('U-Feld', 0)] })
    const h = ev('h', { clusters: [hs('H-Feld', 5)] })
    const res = groupEventsForBooklet([u, h])
    expect(res.clusterGroups.map((g) => g.name)).toEqual(['H-Feld', 'U-Feld'])
  })

  it('orders within an institution by sortOrder then name', () => {
    const a = ev('a', { clusters: [uni('Zeta', 2)] })
    const b = ev('b', { clusters: [uni('Alpha', 1)] })
    const res = groupEventsForBooklet([a, b])
    expect(res.clusterGroups.map((g) => g.name)).toEqual(['Alpha', 'Zeta'])
  })

  it('time-sorts events within a group (no-time last)', () => {
    const late = ev('late', { time: '2026-11-19T11:00', clusters: [uni('F', 0)] })
    const early = ev('early', { time: '2026-11-19T09:00', clusters: [uni('F', 0)] })
    const none = ev('none', { time: null, clusters: [uni('F', 0)] })
    const res = groupEventsForBooklet([late, none, early])
    expect(res.clusterGroups[0].events.map((e) => e.id)).toEqual(['early', 'late', 'none'])
  })

  it('places an event linked to two clusters in both groups', () => {
    const e = ev('e', { clusters: [uni('A', 0), hs('B', 0)] })
    const res = groupEventsForBooklet([e])
    expect(res.clusterGroups.map((g) => g.name).sort()).toEqual(['A', 'B'])
  })

  it('keeps same-named clusters of different institutions apart (Zentrale Angebote)', () => {
    const u = ev('u', { clusters: [uni('Zentrale Angebote', 1)] })
    const h = ev('h', { clusters: [hs('Zentrale Angebote', 1)] })
    const res = groupEventsForBooklet([u, h])
    expect(
      res.clusterGroups.map((g) => [g.institution, g.name, g.events.map((e) => e.id)])
    ).toEqual([
      ['HOCHSCHULE', 'Zentrale Angebote', ['h']],
      ['UNI', 'Zentrale Angebote', ['u']],
    ])
  })

  it('buckets a non-cross event without clusters under "Ohne Studienfeld", ranked last', () => {
    const withField = ev('w', { clusters: [uni('Feld', 0)] })
    const without = ev('x', {})
    const res = groupEventsForBooklet([withField, without])
    expect(res.clusterGroups[res.clusterGroups.length - 1].name).toBe('Ohne Studienfeld')
  })

  it('leaves out the two Lehramt Studienfelder (the Lehramt block replaces them)', () => {
    const fachrichtung = ev('f', { clusters: [uni('Lehramt', 0)] })
    const technik = ev('t', {
      clusters: [hs('Lehramt an berufsbildenden Schulen', 0), hs('Ingenieurwissenschaften', 0)],
    })
    const res = groupEventsForBooklet([fachrichtung, technik], new Set(['f', 't']))
    expect(res.clusterGroups.map((g) => [g.name, g.events.map((e) => e.id)])).toEqual([
      ['Ingenieurwissenschaften', ['t']],
    ])
  })

  it('keeps an event of a Lehramt Studienfeld under "Ohne Studienfeld" when the Lehramt block does not show it', () => {
    const orphan = ev('o', { clusters: [uni('Lehramt', 0)] })
    const res = groupEventsForBooklet([orphan])
    expect(res.clusterGroups.map((g) => [g.name, g.events.map((e) => e.id)])).toEqual([
      ['Ohne Studienfeld', ['o']],
    ])
  })

  it('does not repeat an event under "Ohne Studienfeld" that the Lehramt block shows', () => {
    const shown = ev('s', { programIds: ['fachrichtung'] })
    const res = groupEventsForBooklet([shown], new Set(['s']))
    expect(res.clusterGroups).toEqual([])
  })
})

const lp = (
  id: string,
  name: string,
  lehramtTypen: LehramtTypValue[],
  flags: { studiengang?: boolean; fachrichtung?: boolean } = {}
) => ({
  id,
  name,
  lehramtTypen,
  isLehramtStudiengang: flags.studiengang ?? false,
  isBeruflicheFachrichtung: flags.fachrichtung ?? false,
})

describe('groupLehramtEventsForBooklet', () => {
  const programs = groupLehramtPrograms([
    lp('ghr', 'Lehramt an Grund-, Haupt- und Realschulen', ['GRUND_HAUPT_REAL'], {
      studiengang: true,
    }),
    lp('gym', 'Lehramt an Gymnasien', ['GYMNASIUM'], { studiengang: true }),
    lp('bbs', 'Lehramt an berufsbildenden Schulen', ['BERUFSBILDEND'], { studiengang: true }),
    lp('metall', 'Metalltechnik - Berufliche Bildung', ['BERUFSBILDEND'], { fachrichtung: true }),
    lp('elektro', 'Elektrotechnik - Berufliche Bildung', ['BERUFSBILDEND'], {
      fachrichtung: true,
    }),
    lp('kosm', 'Kosmetologie - Berufliche Bildung', ['BERUFSBILDEND'], { fachrichtung: true }),
    lp('mathe', 'Mathematik', ['GRUND_HAUPT_REAL', 'GYMNASIUM', 'BERUFSBILDEND']),
  ])

  const ghrTalk = ev('ghr-talk', { cross: true, time: '2026-11-19T13:15', programIds: ['ghr'] })
  const gymTalk = ev('gym-talk', { cross: true, time: '2026-11-19T11:15', programIds: ['gym'] })
  const bbsTalk = ev('bbs-talk', { cross: true, time: '2026-11-19T09:15', programIds: ['bbs'] })
  const bwpStand = ev('bwp', {
    cross: true,
    time: '2026-11-19T08:30',
    programIds: ['bbs', 'metall', 'elektro'],
  })
  const labor = ev('labor', { time: '2026-11-19T12:00', programIds: ['elektro'] })
  const matheTalk = ev('mathe-talk', { programIds: ['mathe'] })

  it('lists the Schulformen first, each with its Lehramt-Studiengang events by time (Rund ums Studium included)', () => {
    const res = groupLehramtEventsForBooklet([ghrTalk, gymTalk, bbsTalk, bwpStand], programs)
    expect(res.schulformen.map((g) => [g.title, g.events.map((e) => e.id)])).toEqual([
      ['Lehramt an Grund-, Haupt- und Realschulen', ['ghr-talk']],
      ['Lehramt an Gymnasien', ['gym-talk']],
      ['Lehramt an berufsbildenden Schulen', ['bwp', 'bbs-talk']],
    ])
  })

  it('then lists each berufliche Fachrichtung alphabetically with its events, skipping empty ones', () => {
    const res = groupLehramtEventsForBooklet([labor, bwpStand], programs)
    expect(res.fachrichtungen.map((g) => [g.title, g.events.map((e) => e.id)])).toEqual([
      ['Elektrotechnik - Berufliche Bildung', ['bwp', 'labor']],
      ['Metalltechnik - Berufliche Bildung', ['bwp']],
    ])
  })

  it('leaves out Unterrichtsfächer and Schulformen without events', () => {
    const res = groupLehramtEventsForBooklet([gymTalk, matheTalk], programs)
    expect(res.schulformen.map((g) => g.title)).toEqual(['Lehramt an Gymnasien'])
    expect(res.fachrichtungen).toEqual([])
  })
})

describe('groupInfoMarketsForBooklet', () => {
  const market = (id: string, name: string, events: ReturnType<typeof ev>[]) => ({
    id,
    name,
    location: `${name} Ort`,
    events: events.map((event) => ({ event })),
  })

  it('orders the markets like the Infomärkte page and lists their stands by time', () => {
    const res = groupInfoMarketsForBooklet([
      market('c', 'Infomarkt Caprivi', [ev('c1')]),
      market('sl', 'Infomarkt SL', []),
      market('s', 'Infomarkt Schloss', [
        ev('late', { time: '2026-11-19T10:00' }),
        ev('early', { time: '2026-11-19T08:30' }),
      ]),
    ])
    expect(res.map((m) => [m.name, m.location, m.events.map((e) => e.id)])).toEqual([
      ['Infomarkt Schloss', 'Infomarkt Schloss Ort', ['early', 'late']],
      ['Infomarkt SL', 'Infomarkt SL Ort', []],
      ['Infomarkt Caprivi', 'Infomarkt Caprivi Ort', ['c1']],
    ])
  })

  it('lists stands with the same start time in German alphabetical order', () => {
    const res = groupInfoMarketsForBooklet([
      market('s', 'Infomarkt Schloss', [
        ev('z', { title: 'Zentrale Studienberatung' }),
        ev('oe', { title: 'Ökotrophologie' }),
        ev('a', { title: 'Agrar' }),
      ]),
    ])
    expect(res[0].events.map((e) => e.title)).toEqual([
      'Agrar',
      'Ökotrophologie',
      'Zentrale Studienberatung',
    ])
  })
})
