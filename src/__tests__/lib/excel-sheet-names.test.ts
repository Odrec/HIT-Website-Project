import { describe, it, expect } from 'vitest'
import { sanitizeSheetName, uniqueSheetName } from '@/lib/excel-sheet-names'

describe('sanitizeSheetName', () => {
  it('strips characters Excel forbids', () => {
    expect(sanitizeSheetName('Sozialwissenschaften/Politik')).toBe('Sozialwissenschaften-Politik')
    expect(sanitizeSheetName('A*B?C:D[E]F\\G')).toBe('A-B-C-D-E-F-G')
  })

  it('truncates to 31 characters', () => {
    expect(sanitizeSheetName('x'.repeat(50))).toHaveLength(31)
  })

  it('falls back for empty names', () => {
    expect(sanitizeSheetName('   ')).toBe('Ohne Namen')
  })
})

describe('uniqueSheetName', () => {
  it('returns the sanitized name when free', () => {
    const taken = new Set<string>()
    expect(uniqueSheetName(taken, 'Biologie')).toBe('Biologie')
    expect(taken.has('Biologie')).toBe(true)
  })

  it('de-duplicates names that collide after truncation', () => {
    const taken = new Set<string>()
    const a = uniqueSheetName(taken, 'Wirtschaftsinformatik (Bachelor of Science)')
    const b = uniqueSheetName(taken, 'Wirtschaftsinformatik (Bachelor of Arts)')
    expect(a).not.toBe(b)
    expect(a).toHaveLength(31)
    expect(b).toHaveLength(31)
    expect(b.endsWith(' (2)')).toBe(true)
  })

  it('keeps counting past the second collision', () => {
    const taken = new Set<string>()
    uniqueSheetName(taken, 'Physik')
    expect(uniqueSheetName(taken, 'Physik')).toBe('Physik (2)')
    expect(uniqueSheetName(taken, 'Physik')).toBe('Physik (3)')
  })

  it('avoids the reserved name History', () => {
    expect(uniqueSheetName(new Set(), 'History')).toBe('Verlauf')
  })
})
