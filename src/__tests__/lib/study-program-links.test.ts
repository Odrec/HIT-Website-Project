import { describe, it, expect } from 'vitest'
import { normalizeLinksInput } from '@/lib/study-program-links'

describe('normalizeLinksInput', () => {
  it('returns [] for non-array / empty input', () => {
    expect(normalizeLinksInput(undefined)).toEqual([])
    expect(normalizeLinksInput(null)).toEqual([])
    expect(normalizeLinksInput([])).toEqual([])
  })

  it('drops rows whose url is empty/whitespace', () => {
    const out = normalizeLinksInput([
      { label: 'A', url: '   ' },
      { label: 'B', url: '' },
    ])
    expect(out).toEqual([])
  })

  it('defaults a blank label to "Zur Studiengang-Seite"', () => {
    const out = normalizeLinksInput([{ label: '  ', url: 'example.com' }])
    expect(out[0].label).toBe('Zur Studiengang-Seite')
  })

  it('normalizes urls (adds https://) via normalizeExternalUrl', () => {
    const out = normalizeLinksInput([{ label: 'Fach', url: 'www.uni-osnabrueck.de/x' }])
    expect(out[0].url).toBe('https://www.uni-osnabrueck.de/x')
  })

  it('assigns sortOrder by array index, ignoring incoming sortOrder', () => {
    const out = normalizeLinksInput([
      { label: 'First', url: 'a.de', sortOrder: 99 },
      { label: 'Second', url: 'b.de', sortOrder: 5 },
    ])
    expect(out.map((l) => l.sortOrder)).toEqual([0, 1])
    expect(out.map((l) => l.label)).toEqual(['First', 'Second'])
  })
})