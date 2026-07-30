import { describe, it, expect } from 'vitest'
import { compareDe, compareDeBy, azLetter } from '@/lib/sort-de'

describe('compareDe', () => {
  it('sorts umlauts under their base letter (DIN 5007-1)', () => {
    const input = [
      'Zahnmedizin',
      'Ökotrophologie',
      'Ästhetik',
      'Übersetzen',
      'Ozeanografie',
      'Osteologie',
    ]
    expect([...input].sort(compareDe)).toEqual([
      'Ästhetik',
      'Ökotrophologie',
      'Osteologie',
      'Ozeanografie',
      'Übersetzen',
      'Zahnmedizin',
    ])
  })

  it('does not push umlauts after Z', () => {
    expect(compareDe('Ökotrophologie', 'Zahnmedizin')).toBeLessThan(0)
  })

  it('compares Ö as O at the primary level', () => {
    // Ö == O, so the second character decides: f < k
    expect(compareDe('Offenbach', 'Ökonomie')).toBeLessThan(0)
  })

  it('sorts numbers naturally', () => {
    expect(['Modul 10', 'Modul 2'].sort(compareDe)).toEqual(['Modul 2', 'Modul 10'])
  })
})

describe('compareDeBy', () => {
  it('sorts objects by a selected string field', () => {
    const items = [{ name: 'Österreich' }, { name: 'Osnabrück' }]
    expect(items.sort(compareDeBy((i) => i.name))).toEqual([
      { name: 'Osnabrück' },
      { name: 'Österreich' },
    ])
  })
})

describe('azLetter', () => {
  it('files Ö under O', () => {
    expect(azLetter('Ökotrophologie')).toBe('O')
  })

  it('files Ä under A and Ü under U', () => {
    expect(azLetter('Ästhetik')).toBe('A')
    expect(azLetter('Übersetzen')).toBe('U')
  })

  it('uppercases a plain first letter', () => {
    expect(azLetter('biologie')).toBe('B')
  })

  it('returns # for non-alphabetic and empty names', () => {
    expect(azLetter('3D-Druck')).toBe('#')
    expect(azLetter('   ')).toBe('#')
    expect(azLetter('')).toBe('#')
  })
})
