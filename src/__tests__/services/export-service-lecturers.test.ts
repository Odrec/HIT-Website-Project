import { describe, it, expect } from 'vitest'
import { aggregateLecturers } from '@/services/export-service'

const rec = (
  firstName: string,
  lastName: string,
  email: string | null,
  eventId: string,
  opts: {
    org?: string | null
    room?: string | null
    programs?: Array<[string, string[]]>
  } = {}
) => ({
  firstName,
  lastName,
  title: 'Dr.',
  email,
  affiliation: 'UNI' as const,
  event: {
    id: eventId,
    melder: opts.org !== undefined ? { organisationseinheit: opts.org } : null,
    room: opts.room ? { name: opts.room } : null,
    building: null,
    studyPrograms: (opts.programs ?? []).map(([name, clusters]) => ({
      studyProgram: { name, clusters: clusters.map((c) => ({ name: c })) },
    })),
  },
})

describe('aggregateLecturers', () => {
  it('dedupes the same person (by email) across events and counts events', () => {
    const rows = aggregateLecturers([
      rec('Anna', 'Meyer', 'a@uni.de', 'e1', { programs: [['Informatik', ['MINT']]] }),
      rec('Anna', 'Meyer', 'A@UNI.DE', 'e2', { programs: [['Mathematik', ['MINT']]] }),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      name: 'Anna Meyer',
      anzahlVeranstaltungen: 2,
      studiengaenge: 'Informatik, Mathematik',
      studienfeld: 'MINT',
    })
  })

  it('pulls Fakultät/Fachbereich from the first non-empty Melder organisationseinheit', () => {
    const rows = aggregateLecturers([
      rec('B', 'C', 'b@x.de', 'e1', { org: null }),
      rec('B', 'C', 'b@x.de', 'e2', { org: 'Fachbereich 6' }),
    ])
    expect(rows[0].organisationseinheit).toBe('Fachbereich 6')
  })

  it('falls back to name+title when email is missing, and joins distinct rooms', () => {
    const rows = aggregateLecturers([
      rec('No', 'Email', null, 'e1', { room: 'R1' }),
      rec('No', 'Email', null, 'e2', { room: 'R2' }),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0].raum).toBe('R1, R2')
    expect(rows[0].anzahlVeranstaltungen).toBe(2)
  })

  it('keeps different people separate and sorts by name', () => {
    const rows = aggregateLecturers([
      rec('Zoe', 'Z', 'z@x.de', 'e1'),
      rec('Amy', 'A', 'a@x.de', 'e2'),
    ])
    expect(rows.map((r) => r.name)).toEqual(['Amy A', 'Zoe Z'])
  })
})
