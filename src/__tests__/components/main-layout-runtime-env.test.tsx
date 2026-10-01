import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Records the order in which MainLayout waits for the request and reads env.
const events = vi.hoisted(() => [] as string[])
vi.mock('next/server', () => ({
  connection: vi.fn(async () => {
    events.push('connection')
  }),
}))
vi.mock('@/components/layout/Header', () => ({
  Header: ({ startHref }: { startHref: string }) => {
    events.push('render')
    return <a href={startHref}>Start</a>
  },
}))
vi.mock('@/components/layout/Footer', () => ({ Footer: () => null }))

import { MainLayout } from '@/components/layout/MainLayout'

beforeEach(() => {
  events.length = 0
  vi.stubEnv('START_URL', 'https://example.org/runtime-start')
})
afterEach(() => vi.unstubAllEnvs())

describe('MainLayout', () => {
  // Without this, Next prerenders /events, /schedule, /impressum … at build time
  // and START_URL / CONTACT_EMAIL are frozen to whatever the build saw.
  it('waits for the incoming request before reading runtime env', async () => {
    render(await MainLayout({ children: null }))
    expect(events).toEqual(['connection', 'render'])
    expect(screen.getByRole('link', { name: 'Start' })).toHaveAttribute(
      'href',
      'https://example.org/runtime-start'
    )
  })
})
