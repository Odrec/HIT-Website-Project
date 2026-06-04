export type AZInstitution = 'all' | 'UNI' | 'HOCHSCHULE'

export interface AZProgram {
  id: string
  name: string
  institution: 'UNI' | 'HOCHSCHULE' | 'BOTH'
}

export function filterProgramsByInstitution<T extends AZProgram>(
  programs: T[],
  filter: AZInstitution
): T[] {
  if (filter === 'all') return programs
  return programs.filter((p) => p.institution === filter || p.institution === 'BOTH')
}

export function groupProgramsByLetter<T extends AZProgram>(
  programs: T[]
): Array<{ letter: string; programs: T[] }> {
  const map = new Map<string, T[]>()
  for (const p of programs) {
    const letter = (p.name.charAt(0) || '#').toUpperCase()
    if (!map.has(letter)) map.set(letter, [])
    map.get(letter)!.push(p)
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0], 'de'))
    .map(([letter, list]) => ({
      letter,
      programs: list.sort((a, b) => a.name.localeCompare(b.name, 'de')),
    }))
}
