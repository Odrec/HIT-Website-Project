import { describe, it, expect, beforeEach } from 'vitest'
import { trackEvent, trackSearch } from '@/lib/analytics'

describe('trackEvent', () => {
  beforeEach(() => {
    ;(window as { _paq?: unknown[][] })._paq = []
  })

  it('pushes trackEvent to _paq when available', () => {
    trackEvent('schedule', 'add', 'Informatik erleben')
    expect((window as { _paq?: unknown[][] })._paq).toContainEqual([
      'trackEvent',
      'schedule',
      'add',
      'Informatik erleben',
      undefined,
    ])
  })

  it('does nothing when _paq is not defined', () => {
    delete (window as { _paq?: unknown[][] })._paq
    expect(() => trackEvent('schedule', 'add')).not.toThrow()
  })

  it('includes numeric value when provided', () => {
    trackEvent('filter', 'institution', 'UNI', 1)
    expect((window as { _paq?: unknown[][] })._paq).toContainEqual([
      'trackEvent',
      'filter',
      'institution',
      'UNI',
      1,
    ])
  })
})

describe('trackSearch', () => {
  beforeEach(() => {
    ;(window as { _paq?: unknown[][] })._paq = []
  })

  it('pushes trackSiteSearch to _paq', () => {
    trackSearch('informatik', 'events', 5)
    expect((window as { _paq?: unknown[][] })._paq).toContainEqual([
      'trackSiteSearch',
      'informatik',
      'events',
      5,
    ])
  })
})
