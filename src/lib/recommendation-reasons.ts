import type { RecommendationReason } from '@/types/recommendations'

/**
 * Shown when no scoring signal produced a reason, so the card's
 * "Empfehlung basiert auf:" block is never empty.
 */
export const FALLBACK_REASON: RecommendationReason = {
  type: 'popularity',
  description: 'Allgemeine Empfehlung für den Hochschulinfotag',
  weight: 0,
}

export function withFallbackReason(reasons: RecommendationReason[]): RecommendationReason[] {
  return reasons.length > 0 ? reasons : [FALLBACK_REASON]
}
