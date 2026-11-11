import { describe, it, expect } from 'vitest'
import { lageplanHref, LAGEPLAN_BUILDING_PARAM, googleMapsLocationUrl } from '@/lib/map-links'

describe('lageplanHref', () => {
  it('points at the internal Lageplan with the building slug', () => {
    expect(lageplanHref('11-aula')).toBe('/route-planner?building=11-aula')
    expect(lageplanHref('FC')).toBe('/route-planner?building=FC')
  })
  it('encodes slugs that admins typed with spaces or umlauts', () => {
    const href = lageplanHref('Fachbereich Biologie')
    expect(href).toBe('/route-planner?building=Fachbereich%20Biologie')
    const url = new URL(href, 'https://hit.example')
    expect(url.searchParams.get(LAGEPLAN_BUILDING_PARAM)).toBe('Fachbereich Biologie')
  })
})

describe('googleMapsLocationUrl', () => {
  it('searches for the coordinates, which Google cannot misread', () => {
    const url = new URL(googleMapsLocationUrl({ latitude: 52.2715, longitude: 8.044231 }))
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/search/')
    expect(url.searchParams.get('api')).toBe('1')
    expect(url.searchParams.get('query')).toBe('52.2715,8.044231')
  })
})
