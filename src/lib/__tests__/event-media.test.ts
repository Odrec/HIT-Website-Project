import { describe, it, expect } from 'vitest'
import { detectImageType, validateEventMedia } from '@/lib/event-media'

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)])
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))

describe('detectImageType', () => {
  it('recognises JPEG, PNG and WebP by their leading bytes', () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg')
    expect(detectImageType(bytes(0x89, ...ascii('PNG'), 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png')
    expect(detectImageType(bytes(...ascii('RIFF'), 1, 2, 3, 4, ...ascii('WEBP')))).toBe(
      'image/webp'
    )
  })

  it('rejects anything else, whatever the file claims to be', () => {
    expect(detectImageType(new TextEncoder().encode('<svg onload="alert(1)">'))).toBeNull()
    expect(detectImageType(new Uint8Array([0xff, 0xd8]))).toBeNull()
  })
})

describe('validateEventMedia', () => {
  it('accepts an uploaded image and an external image address', () => {
    expect(validateEventMedia({ photoUrl: '/api/images/cmuabc123xyz' })).toEqual({
      data: { photoUrl: '/api/images/cmuabc123xyz' },
    })
    expect(validateEventMedia({ photoUrl: ' https://example.org/a.jpg ' })).toEqual({
      data: { photoUrl: 'https://example.org/a.jpg' },
    })
  })

  it('stores a recognised video link in its canonical form', () => {
    expect(validateEventMedia({ videoUrl: 'https://youtu.be/bsA6AfLREkI?si=x' })).toEqual({
      data: { videoUrl: 'https://www.youtube.com/watch?v=bsA6AfLREkI' },
    })
  })

  it('turns empty values into null and leaves absent fields alone', () => {
    expect(validateEventMedia({ photoUrl: '', videoUrl: null })).toEqual({
      data: { photoUrl: null, videoUrl: null },
    })
    expect(validateEventMedia({})).toEqual({ data: {} })
  })

  it('points a video link in the photo field to the video field', () => {
    expect(validateEventMedia({ photoUrl: 'https://youtu.be/bsA6AfLREkI' })).toEqual({
      error: 'Foto: Das ist ein Video-Link – bitte im Feld „Video“ eintragen.',
    })
  })

  it('rejects photo values that are neither an upload nor a web address', () => {
    for (const photoUrl of ['/uploads/events/x.jpg', 'javascript:alert(1)', 42]) {
      expect(validateEventMedia({ photoUrl })).toEqual({
        error: 'Foto: Bitte ein Bild hochladen oder die Adresse eines Bildes (https://…) angeben.',
      })
    }
  })

  it('rejects a video link that is not YouTube or Vimeo', () => {
    expect(validateEventMedia({ videoUrl: 'https://www.hs-osnabrueck.de/musik/' })).toEqual({
      error: 'Video: Bitte einen Link zu einem YouTube- oder Vimeo-Video angeben.',
    })
  })
})
