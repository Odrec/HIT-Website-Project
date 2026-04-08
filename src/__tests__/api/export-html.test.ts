import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    event: { findMany: vi.fn() },
  },
}))

import { GET } from '@/app/api/export/html/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

const mockAuth = vi.mocked(auth)
const mockFindMany = vi.mocked(prisma.event.findMany)

const mockEvents = [
  {
    id: 'event1',
    title: 'Einführung in die Informatik',
    eventType: 'VORTRAG',
    institution: 'UNI',
    timeStart: new Date('2026-11-19T10:00:00'),
    timeEnd: new Date('2026-11-19T11:00:00'),
    description: 'Eine spannende Einführung',
    building: { name: 'Gebäude 66' },
    room: { name: 'Raum 101', building: { name: 'Gebäude 66' } },
    lecturers: [
      { title: 'Prof. Dr.', firstName: 'Max', lastName: 'Mustermann' },
    ],
    studyPrograms: [
      { studyProgram: { name: 'Informatik (B.Sc.)' } },
    ],
    location: null,
    organizers: [],
    melder: null,
    infoMarkets: [],
  },
  {
    id: 'event2',
    title: 'Maschinenbau Workshop',
    eventType: 'WORKSHOP',
    institution: 'HOCHSCHULE',
    timeStart: new Date('2026-11-19T14:00:00'),
    timeEnd: null,
    description: null,
    building: null,
    room: null,
    lecturers: [],
    studyPrograms: [],
    location: null,
    organizers: [],
    melder: null,
    infoMarkets: [],
  },
]

describe('GET /api/export/html', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('EXPORT_API_KEY', 'test-key-123')
  })

  it('returns 401 without auth or API key', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/export/html')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('allows access with valid API key', async () => {
    mockFindMany.mockResolvedValue(mockEvents as never)

    const request = new NextRequest('http://localhost/api/export/html?key=test-key-123')
    const response = await GET(request)

    expect(response.status).toBe(200)
  })

  it('returns 401 with invalid API key', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/export/html?key=wrong-key')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('allows access for admin session', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'ADMIN' } } as never)
    mockFindMany.mockResolvedValue(mockEvents as never)

    const request = new NextRequest('http://localhost/api/export/html')
    const response = await GET(request)

    expect(response.status).toBe(200)
  })

  it('returns 401 for non-admin session', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'ORGANIZER' } } as never)

    const request = new NextRequest('http://localhost/api/export/html')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('returns HTML content type', async () => {
    mockFindMany.mockResolvedValue(mockEvents as never)

    const request = new NextRequest('http://localhost/api/export/html?key=test-key-123')
    const response = await GET(request)

    expect(response.headers.get('Content-Type')).toContain('text/html')
  })

  it('HTML contains event data — title, type label, institution', async () => {
    mockFindMany.mockResolvedValue(mockEvents as never)

    const request = new NextRequest('http://localhost/api/export/html?key=test-key-123')
    const response = await GET(request)
    const html = await response.text()

    expect(html).toContain('Einführung in die Informatik')
    expect(html).toContain('Vortrag')
    expect(html).toContain('Universität Osnabrück')
    expect(html).toContain('Maschinenbau Workshop')
    expect(html).toContain('Workshop')
    expect(html).toContain('Hochschule Osnabrück')
  })

  it('HTML contains location data', async () => {
    mockFindMany.mockResolvedValue(mockEvents as never)

    const request = new NextRequest('http://localhost/api/export/html?key=test-key-123')
    const response = await GET(request)
    const html = await response.text()

    expect(html).toContain('Raum 101')
  })

  it('sets Content-Disposition header with filename', async () => {
    mockFindMany.mockResolvedValue(mockEvents as never)

    const request = new NextRequest('http://localhost/api/export/html?key=test-key-123')
    const response = await GET(request)

    const disposition = response.headers.get('Content-Disposition')
    expect(disposition).toContain('attachment')
    expect(disposition).toContain('hit-2026-events-')
    expect(disposition).toContain('.html')
  })

  it('HTML contains the page title', async () => {
    mockFindMany.mockResolvedValue(mockEvents as never)

    const request = new NextRequest('http://localhost/api/export/html?key=test-key-123')
    const response = await GET(request)
    const html = await response.text()

    expect(html).toContain('HIT 2026')
    expect(html).toContain('Alle Veranstaltungen')
  })
})
