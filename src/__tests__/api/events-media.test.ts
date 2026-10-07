import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { role: 'ADMIN', id: 'admin-1' } }),
}))

const mockGetById = vi.fn()
const mockUpdate = vi.fn()
const mockCreate = vi.fn()
vi.mock('@/services', () => ({
  eventService: {
    getById: (...args: unknown[]) => mockGetById(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    create: (...args: unknown[]) => mockCreate(...args),
  },
}))
vi.mock('@/lib/email', () => ({
  sendEventUpdatedEmail: vi.fn().mockResolvedValue(undefined),
  sendEventCreatedEmail: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/db/prisma', () => ({ prisma: {} }))

import { PUT } from '@/app/api/events/[id]/route'
import { POST } from '@/app/api/events/route'

const put = (body: object) =>
  PUT(new Request('http://test', { method: 'PUT', body: JSON.stringify(body) }) as never, {
    params: Promise.resolve({ id: 'ev1' }),
  })
const post = (body: object) =>
  POST(new Request('http://test', { method: 'POST', body: JSON.stringify(body) }) as never)
const newEvent = { title: 'Imagefilm', eventType: 'VIDEO', institution: 'UNI' }

beforeEach(() => {
  vi.clearAllMocks()
  mockGetById.mockResolvedValue({ id: 'ev1', reviewStatus: 'PUBLISHED', title: 'Imagefilm' })
  mockUpdate.mockResolvedValue({ id: 'ev1' })
  mockCreate.mockResolvedValue({ id: 'ev2' })
})

describe('event photo and video fields', () => {
  it('stores a YouTube share link in canonical form on update', async () => {
    const res = await put({ title: 'Imagefilm', videoUrl: 'https://youtu.be/bsA6AfLREkI?si=x' })
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ videoUrl: 'https://www.youtube.com/watch?v=bsA6AfLREkI' })
    )
  })

  it('rejects a video link pasted into the photo field with a German hint', async () => {
    const res = await put({ title: 'Imagefilm', photoUrl: 'https://youtu.be/bsA6AfLREkI' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: 'Foto: Das ist ein Video-Link – bitte im Feld „Video“ eintragen.',
    })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('does not touch the media fields when an update leaves them out', async () => {
    await put({ title: 'nur Titel' })
    const data = mockUpdate.mock.calls[0][0]
    expect('photoUrl' in data).toBe(false)
    expect('videoUrl' in data).toBe(false)
  })

  it('validates the media fields on create too', async () => {
    const bad = await post({ ...newEvent, videoUrl: 'https://www.hs-osnabrueck.de/musik/' })
    expect(bad.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()

    await post({ ...newEvent, photoUrl: '/api/images/cmuimg123', videoUrl: '' })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ photoUrl: '/api/images/cmuimg123', videoUrl: null })
    )
  })
})
