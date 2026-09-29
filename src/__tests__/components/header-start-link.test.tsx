import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

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

describe('Header "Start" entry', () => {
  it('points both Start links at the configured external URL', () => {
    render(<Header startHref="https://www.zsb-os.de/hit" />)
    const links = screen.getAllByRole('link', { name: 'Start' })
    expect(links.length).toBeGreaterThanOrEqual(1)
    for (const l of links) expect(l).toHaveAttribute('href', 'https://www.zsb-os.de/hit')
  })

  it('falls back to the internal homepage when no URL is given', () => {
    render(<Header />)
    for (const l of screen.getAllByRole('link', { name: 'Start' }))
      expect(l).toHaveAttribute('href', '/')
  })
})
