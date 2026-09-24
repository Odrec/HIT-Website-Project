import { describe, it, expect } from 'vitest'
import { normalizeCampus, CAMPUS_LABELS, getCampusColor } from '@/lib/campus'

describe('normalizeCampus', () => {
  it('maps the DB spellings onto the four campus keys', () => {
    expect(normalizeCampus('Innenstadt')).toBe('schloss')
    expect(normalizeCampus('Schloss')).toBe('schloss')
    expect(normalizeCampus('schloss')).toBe('schloss')
    expect(normalizeCampus('Westerberg')).toBe('westerberg')
    expect(normalizeCampus(' Caprivi ')).toBe('caprivi')
    expect(normalizeCampus('Caprivi-Campus')).toBe('caprivi')
  })
  it('falls back to other for unknown, empty and null values', () => {
    expect(normalizeCampus('Lingen')).toBe('other')
    expect(normalizeCampus('')).toBe('other')
    expect(normalizeCampus(null)).toBe('other')
    expect(normalizeCampus(undefined)).toBe('other')
  })
  it('has a German label and a colour for every key', () => {
    for (const key of ['schloss', 'westerberg', 'caprivi', 'other'] as const) {
      expect(CAMPUS_LABELS[key]).toBeTruthy()
      expect(getCampusColor(key)).toMatch(/^#/)
    }
    expect(getCampusColor('caprivi')).toBe('#009EE3')
    expect(getCampusColor('schloss')).toBe('#AC0634')
  })
})
