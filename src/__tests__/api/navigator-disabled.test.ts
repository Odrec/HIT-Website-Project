import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const features = vi.hoisted(() => ({ NAVIGATOR_ENABLED: false }))
vi.mock('@/lib/features', () => features)
vi.mock('@/lib/rate-limit', () => ({ withRateLimit: vi.fn().mockResolvedValue(null) }))
vi.mock('@/services/navigator-service', () => ({
  navigatorService: {
    startSession: vi.fn(),
    processMessage: vi.fn(),
    clearSession: vi.fn(),
    getSession: vi.fn(),
    getRecommendation: vi.fn(),
    getEventsForPrograms: vi.fn(),
    getModelDisplayName: vi.fn(),
  },
  NavigatorUnavailableError: class extends Error {},
  NAVIGATOR_SESSION_ID_RE: /^nav_[a-z0-9_]+$/,
}))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

import * as navigatorRoute from '@/app/api/navigator/route'
import * as eventsRoute from '@/app/api/navigator/events/route'
import * as recommendationsRoute from '@/app/api/navigator/recommendations/route'
import NavigatorLayout from '@/app/(public)/navigator/layout'
import { navigatorService } from '@/services/navigator-service'

const req = (url: string, init?: ConstructorParameters<typeof NextRequest>[1]) =>
  new NextRequest(`http://x${url}`, init)

beforeEach(() => {
  vi.clearAllMocks()
  features.NAVIGATOR_ENABLED = false
})

describe('Studiennavigator switched off', () => {
  it('answers 404 on every navigator API without touching the model', async () => {
    const responses = await Promise.all([
      navigatorRoute.GET(req('/api/navigator')),
      navigatorRoute.POST(
        req('/api/navigator', { method: 'POST', body: JSON.stringify({ message: 'Hallo' }) })
      ),
      navigatorRoute.DELETE(req('/api/navigator?sessionId=nav_abc')),
      eventsRoute.GET(req('/api/navigator/events?programIds=p1')),
      recommendationsRoute.GET(req('/api/navigator/recommendations?sessionId=nav_abc')),
    ])
    expect(responses.map((r) => r.status)).toEqual([404, 404, 404, 404, 404])
    for (const fn of Object.values(navigatorService)) expect(fn).not.toHaveBeenCalled()
  })

  it('renders the /navigator page as not found', () => {
    expect(() => NavigatorLayout({ children: null })).toThrow('NEXT_NOT_FOUND')
  })

  it('serves the page again once switched on', () => {
    features.NAVIGATOR_ENABLED = true
    expect(() => NavigatorLayout({ children: null })).not.toThrow()
  })
})
