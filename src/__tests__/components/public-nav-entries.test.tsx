import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const features = vi.hoisted(() => ({ NAVIGATOR_ENABLED: false }))
vi.mock('@/lib/features', () => features)
vi.mock('next/navigation', () => ({ usePathname: () => '/events' }))
vi.mock('@/contexts/schedule-context', () => ({
  useSchedule: () => ({
    state: { items: [] },
    getConflicts: () => [],
    getWatchlistCount: () => 0,
  }),
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}))

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const hrefs = () =>
  screen.getAllByRole('link', { hidden: true }).map((a) => a.getAttribute('href') ?? '')

beforeEach(() => {
  features.NAVIGATOR_ENABLED = false
})

describe('public header and footer', () => {
  it('no longer link visitors to the help manual (covered by the ZSB FAQs)', () => {
    render(
      <>
        <Header />
        <Footer />
      </>
    )
    expect(hrefs().filter((h) => h.startsWith('/hilfe'))).toEqual([])
    expect(screen.queryByText('Hilfe & Anleitung')).toBeNull()
  })

  it('hide the Studiennavigator while it is switched off', () => {
    render(
      <>
        <Header />
        <Footer />
      </>
    )
    expect(hrefs()).not.toContain('/navigator')
    expect(screen.queryByText('Studiennavigator')).toBeNull()
  })

  it('show the Studiennavigator again once it is switched on', () => {
    features.NAVIGATOR_ENABLED = true
    render(
      <>
        <Header />
        <Footer />
      </>
    )
    // desktop nav + mobile menu + footer
    expect(hrefs().filter((h) => h === '/navigator').length).toBeGreaterThanOrEqual(2)
  })
})
