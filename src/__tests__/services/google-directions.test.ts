import { describe, it, expect } from 'vitest'
import { decodePolyline } from '@/services/google-directions'

describe('decodePolyline', () => {
  it('decodes a known encoded polyline to lat/lng pairs', () => {
    // Google's example: "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
    // Decodes to: (38.5, -120.2), (40.7, -120.95), (43.252, -126.453)
    const result = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')
    expect(result).toHaveLength(3)
    expect(result[0][0]).toBeCloseTo(38.5, 1)
    expect(result[0][1]).toBeCloseTo(-120.2, 1)
    expect(result[1][0]).toBeCloseTo(40.7, 1)
    expect(result[1][1]).toBeCloseTo(-120.95, 1)
  })

  it('returns empty array for empty string', () => {
    expect(decodePolyline('')).toEqual([])
  })
})
