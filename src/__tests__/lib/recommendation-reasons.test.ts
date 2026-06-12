import { describe, it, expect } from 'vitest'
import { withFallbackReason, FALLBACK_REASON } from '@/lib/recommendation-reasons'
import type { RecommendationReason } from '@/types/recommendations'

describe('withFallbackReason', () => {
  it('returns the original array when reasons exist', () => {
    const reasons: RecommendationReason[] = [
      { type: 'study_program', description: 'Passt zu 1 deiner Studiengänge', weight: 0.2 },
    ]
    expect(withFallbackReason(reasons)).toBe(reasons)
  })

  it('returns the fallback reason for an empty array', () => {
    const result = withFallbackReason([])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(FALLBACK_REASON)
    expect(result[0].description).toBe('Allgemeine Empfehlung für den Hochschulinfotag')
  })
})
