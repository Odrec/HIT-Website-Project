import { describe, it, expect } from 'vitest'
import { compareByTimeClusterProgram, firstClusterName } from '@/services/export-service'

const ev = (timeStart: string | null, programs: Array<[string, string[]]>) => ({
  timeStart,
  studyPrograms: programs.map(([name, clusters]) => ({
    studyProgram: { name, clusters: clusters.map((c) => ({ name: c })) },
  })),
})

describe('compareByTimeClusterProgram', () => {
  it('orders by time first', () => {
    const a = ev('2026-11-19T10:00', [['Z-Prog', ['Z-Feld']]])
    const b = ev('2026-11-19T09:00', [['A-Prog', ['A-Feld']]])
    expect([a, b].sort(compareByTimeClusterProgram)[0]).toBe(b)
  })

  it('breaks time ties by Studienfeld, then Studiengang', () => {
    const a = ev('2026-11-19T09:00', [['B-Prog', ['B-Feld']]])
    const b = ev('2026-11-19T09:00', [['A-Prog', ['A-Feld']]])
    expect([a, b].sort(compareByTimeClusterProgram)[0]).toBe(b) // A-Feld before B-Feld
  })

  it('breaks Studienfeld ties by Studiengang', () => {
    const a = ev('2026-11-19T09:00', [['B-Prog', ['Same-Feld']]])
    const b = ev('2026-11-19T09:00', [['A-Prog', ['Same-Feld']]])
    expect([a, b].sort(compareByTimeClusterProgram)[0]).toBe(b)
  })

  it('puts events without a time last', () => {
    const a = ev(null, [['A-Prog', ['A-Feld']]])
    const b = ev('2026-11-19T09:00', [['B-Prog', ['B-Feld']]])
    expect([a, b].sort(compareByTimeClusterProgram)[0]).toBe(b)
  })

  it('firstClusterName returns alphabetically-first cluster across programs', () => {
    expect(firstClusterName(ev('x', [['P', ['Zeta', 'Alpha']]]))).toBe('Alpha')
  })
})