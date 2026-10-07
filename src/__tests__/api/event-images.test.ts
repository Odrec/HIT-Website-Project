// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.fn()
const mockCreate = vi.fn()
const mockFindUnique = vi.fn()

vi.mock('@/auth', () => ({ auth: () => mockAuth() }))
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    uploadedImage: {
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}))

import { POST } from '@/app/api/upload/image/route'
import { GET } from '@/app/api/images/[id]/route'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d])

function upload(content: Uint8Array, name = 'foto.png', type = 'image/png') {
  const form = new FormData()
  form.append('file', new File([content as BlobPart], name, { type }))
  return POST(new Request('http://x/api/upload/image', { method: 'POST', body: form }))
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ORGANIZER' } })
  mockCreate.mockResolvedValue({ id: 'cmuimg123' })
})

describe('POST /api/upload/image', () => {
  it('stores the image in the database and returns its public address', async () => {
    const res = await upload(PNG)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: '/api/images/cmuimg123' })
    const { data } = mockCreate.mock.calls[0][0]
    expect(data.mimeType).toBe('image/png')
    expect(new Uint8Array(data.data)).toEqual(PNG)
  })

  it('requires a login', async () => {
    mockAuth.mockResolvedValue(null)
    expect((await upload(PNG)).status).toBe(401)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('judges the file by its content, not by the type the browser claims', async () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')
    const res = await upload(svg, 'trick.png', 'image/png')
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Nur JPEG-, PNG- und WebP-Bilder sind erlaubt.' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('rejects files over 5 MB', async () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1)
    big.set(PNG)
    const res = await upload(big)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Die Datei ist zu groß (max. 5 MB).' })
  })
})

describe('GET /api/images/[id]', () => {
  const get = (id: string) =>
    GET(new Request(`http://x/api/images/${id}`), { params: Promise.resolve({ id }) })

  it('serves the stored bytes with a long-lived cache header', async () => {
    mockFindUnique.mockResolvedValue({ mimeType: 'image/png', data: Buffer.from(PNG) })
    const res = await get('cmuimg123')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG)
  })

  it('answers 404 for an unknown image', async () => {
    mockFindUnique.mockResolvedValue(null)
    expect((await get('nope')).status).toBe(404)
  })
})
