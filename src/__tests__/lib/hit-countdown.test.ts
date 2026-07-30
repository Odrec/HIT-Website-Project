import { describe, it, expect } from 'vitest'
import { daysUntilHit } from '@/components/home/HitCountdown'

describe('daysUntilHit', () => {
  const hit = new Date('2026-11-19T00:00:00Z')

  it('counts whole days ahead', () => {
    expect(daysUntilHit(hit, new Date('2026-11-17T10:00:00Z'))).toBe(2)
  })

  it('returns 0 on the day itself, whatever the time', () => {
    expect(daysUntilHit(hit, new Date('2026-11-19T00:00:00Z'))).toBe(0)
    expect(daysUntilHit(hit, new Date('2026-11-19T23:59:00Z'))).toBe(0)
  })

  it('returns a negative number afterwards', () => {
    expect(daysUntilHit(hit, new Date('2026-11-20T08:00:00Z'))).toBe(-1)
  })

  it('counts calendar days, not 24-hour blocks, near a DST-adjacent date', () => {
    // `now` is 23:00 and `hit` is 00:00 — a naive ms/86400000 division would
    // see only ~25.04 real hours-as-days between them and floor to 25 instead
    // of 26. This pins the time-of-day skew across the month boundary, not
    // the DST switch itself (Date.UTC arithmetic is timezone-agnostic and
    // never observes DST).
    expect(daysUntilHit(hit, new Date('2026-10-24T23:00:00Z'))).toBe(26)
  })

  it('ignores the time of day on both sides', () => {
    expect(daysUntilHit(hit, new Date('2026-11-18T23:59:00Z'))).toBe(1)
    expect(daysUntilHit(hit, new Date('2026-11-18T00:01:00Z'))).toBe(1)
  })
})
