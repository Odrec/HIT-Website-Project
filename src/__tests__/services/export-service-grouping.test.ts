import { describe, it, expect } from 'vitest'
import { groupEventsByProgram } from '@/services/export-service'

const ev = (id: string, timeStart: string | null, programs: string[]) => ({
  id,
  timeStart,
  studyPrograms: programs.map((name) => ({ studyProgram: { name, clusters: [] } })),
})

describe('groupEventsByProgram', () => {
  it('places an event under each of its programs', () => {
    const e = ev('1', '2026-11-19T09:00', ['Informatik', 'Mathematik'])
    const grouped = groupEventsByProgram([e])
    expect(Object.keys(grouped).sort()).toEqual(['Informatik', 'Mathematik'])
    expect(grouped['Informatik'][0]).toBe(e)
    expect(grouped['Mathematik'][0]).toBe(e)
  })

  it('uses "Ohne Studiengang" for events with no program', () => {
    const grouped = groupEventsByProgram([ev('1', '2026-11-19T09:00', [])])
    expect(Object.keys(grouped)).toEqual(['Ohne Studiengang'])
  })

  it('sorts events within a program by time', () => {
    const late = ev('late', '2026-11-19T11:00', ['Informatik'])
    const early = ev('early', '2026-11-19T09:00', ['Informatik'])
    const grouped = groupEventsByProgram([late, early])
    expect(grouped['Informatik'].map((e) => e.id)).toEqual(['early', 'late'])
  })

  it('orders the program keys alphabetically', () => {
    const grouped = groupEventsByProgram([
      ev('1', '2026-11-19T09:00', ['Zeta']),
      ev('2', '2026-11-19T09:00', ['Alpha']),
    ])
    expect(Object.keys(grouped)).toEqual(['Alpha', 'Zeta'])
  })
})