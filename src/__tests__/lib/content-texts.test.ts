import { describe, it, expect } from 'vitest'
import { CONTENT_SLOTS, CONTENT_DEFAULTS } from '@/lib/content-slots'
import { mergeContentTexts } from '@/lib/content-texts'

describe('CONTENT_SLOTS', () => {
  it('has unique keys', () => {
    const keys = CONTENT_SLOTS.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('ships a non-empty default for every slot', () => {
    for (const slot of CONTENT_SLOTS) {
      expect(slot.default.trim(), `slot ${slot.key}`).not.toBe('')
    }
  })

  it('ships the corrected Studierende figure for the Universität', () => {
    expect(CONTENT_DEFAULTS['home.uni.bullet.students']).toBe('13.000+ Studierende')
  })
})

describe('mergeContentTexts', () => {
  it('returns defaults when there are no overrides', () => {
    expect(mergeContentTexts([])).toEqual(CONTENT_DEFAULTS)
  })

  it('applies an override', () => {
    const merged = mergeContentTexts([
      { key: 'home.uni.bullet.students', value: '12.500+ Studierende' },
    ])
    expect(merged['home.uni.bullet.students']).toBe('12.500+ Studierende')
  })

  it('ignores blank overrides so a slot can never render empty', () => {
    const merged = mergeContentTexts([{ key: 'home.uni.bullet.students', value: '   ' }])
    expect(merged['home.uni.bullet.students']).toBe('13.000+ Studierende')
  })

  it('ignores overrides for keys that are no longer slots', () => {
    const merged = mergeContentTexts([{ key: 'home.removed.slot', value: 'x' }])
    expect(merged['home.removed.slot']).toBeUndefined()
  })
})
