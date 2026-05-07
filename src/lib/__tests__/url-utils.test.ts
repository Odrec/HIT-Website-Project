import { describe, it, expect } from 'vitest'
import { normalizeExternalUrl } from '../url-utils'

describe('normalizeExternalUrl', () => {
  it('returns null for null', () => {
    expect(normalizeExternalUrl(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(normalizeExternalUrl(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(normalizeExternalUrl('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(normalizeExternalUrl('   ')).toBeNull()
  })

  it('passes through https URLs unchanged', () => {
    expect(normalizeExternalUrl('https://example.com')).toBe('https://example.com')
  })

  it('passes through http URLs unchanged', () => {
    expect(normalizeExternalUrl('http://example.com')).toBe('http://example.com')
  })

  it('is case-insensitive when detecting an existing scheme', () => {
    expect(normalizeExternalUrl('HTTPS://example.com')).toBe('HTTPS://example.com')
  })

  it('prefixes https:// to a bare www domain', () => {
    expect(normalizeExternalUrl('www.zsb-os.de')).toBe('https://www.zsb-os.de')
  })

  it('prefixes https:// to a bare domain without www', () => {
    expect(normalizeExternalUrl('example.com/path')).toBe('https://example.com/path')
  })

  it('upgrades protocol-relative URLs to https:', () => {
    expect(normalizeExternalUrl('//cdn.example.com/img')).toBe('https://cdn.example.com/img')
  })

  it('trims surrounding whitespace before normalizing', () => {
    expect(normalizeExternalUrl('  www.example.com  ')).toBe('https://www.example.com')
  })
})