import { describe, it, expect } from 'vitest'
import { groupEventsForBooklet } from '@/services/export-service'

const ev = (
  id: string,
  opts: {
    cross?: boolean
    time?: string | null
    clusters?: Array<{
      name: string
      institution: 'UNI' | 'HOCHSCHULE' | 'BOTH'
      sortOrder: number
    }>
  } = {}
) => ({
  id,
  isCrossProgram: opts.cross ?? false,
  timeStart: 'time' in opts ? (opts.time as string | null) : '2026-11-19T09:00',
  studyPrograms: (opts.clusters ?? []).map((c) => ({ studyProgram: { clusters: [c] } })),
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

  it('buckets a non-cross event without clusters under "Ohne Studienfeld", ranked last', () => {
    const withField = ev('w', { clusters: [uni('Feld', 0)] })
    const without = ev('x', {})
    const res = groupEventsForBooklet([withField, without])
    expect(res.clusterGroups[res.clusterGroups.length - 1].name).toBe('Ohne Studienfeld')
  })
})
