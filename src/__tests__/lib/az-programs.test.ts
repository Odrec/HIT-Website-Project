import { describe, it, expect } from 'vitest'
import { filterProgramsByInstitution, groupProgramsByLetter } from '@/lib/az-programs'

const programs = [
  { id: '1', name: 'Anglistik', institution: 'UNI' as const },
  { id: '2', name: 'Architektur', institution: 'HOCHSCHULE' as const },
  { id: '3', name: 'BWL', institution: 'BOTH' as const },
]

describe('filterProgramsByInstitution', () => {
  it('"all" returns every program', () => {
    expect(filterProgramsByInstitution(programs, 'all')).toHaveLength(3)
  })

  it('"UNI" returns Uni + BOTH', () => {
    expect(filterProgramsByInstitution(programs, 'UNI').map((p) => p.id)).toEqual(['1', '3'])
  })

  it('"HOCHSCHULE" returns Hochschule + BOTH', () => {
    expect(filterProgramsByInstitution(programs, 'HOCHSCHULE').map((p) => p.id)).toEqual(['2', '3'])
  })
})

describe('groupProgramsByLetter', () => {
  it('groups by uppercased first letter, sorted, each group name-sorted', () => {
    const groups = groupProgramsByLetter(programs)
    expect(groups.map((g) => g.letter)).toEqual(['A', 'B'])
    expect(groups[0].programs.map((p) => p.name)).toEqual(['Anglistik', 'Architektur'])
  })
})