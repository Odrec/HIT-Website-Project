import { describe, it, expect } from 'vitest'
import { shouldShowMultiplikatorCafeLink } from '../multiplikator-cafe'

describe('Multiplikator*innen-Café visibility', () => {
  it('hides the link when eventId is null', () => {
    expect(shouldShowMultiplikatorCafeLink(null)).toBe(false)
  })
  it('hides the link when eventId is undefined', () => {
    expect(shouldShowMultiplikatorCafeLink(undefined)).toBe(false)
  })
  it('hides the link when eventId is empty string', () => {
    expect(shouldShowMultiplikatorCafeLink('')).toBe(false)
  })
  it('shows the link when eventId is a non-empty string', () => {
    expect(shouldShowMultiplikatorCafeLink('abc123')).toBe(true)
  })
})
