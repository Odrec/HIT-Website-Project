import { azLetter, compareDe, compareDeBy } from '@/lib/sort-de'

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
    const letter = azLetter(p.name)
    if (!map.has(letter)) map.set(letter, [])
    map.get(letter)!.push(p)
  }
  return Array.from(map.entries())
    .sort((a, b) => compareDe(a[0], b[0]))
    .map(([letter, list]) => ({
      letter,
      programs: list.sort(compareDeBy((x: T) => x.name)),
    }))
}
