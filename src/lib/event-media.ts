import { parseVideoUrl } from '@/lib/video-embed'

/**
 * Photos and videos on events.
 *
 * Uploaded photos are stored in the database (`uploaded_images`) and served by
 * /api/images/<id>: files written into `public/` at runtime are never served
 * by the production server and vanished with every container redeploy.
 */

export const UPLOADED_IMAGE_PATH = /^\/api\/images\/[a-z0-9]+$/

export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

function startsWith(data: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((b, i) => data[offset + i] === b)
}

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))

/**
 * Image type from the file's leading bytes — never from the client-supplied
 * MIME type, since we serve these files back from our own origin.
 */
export function detectImageType(data: Uint8Array): ImageMimeType | null {
  if (startsWith(data, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith(data, [0x89, ...ascii('PNG'), 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (startsWith(data, ascii('RIFF')) && startsWith(data, ascii('WEBP'), 8)) return 'image/webp'
  return null
}

const PHOTO_ERROR =
  'Foto: Bitte ein Bild hochladen oder die Adresse eines Bildes (https://…) angeben.'
const PHOTO_IS_VIDEO_ERROR = 'Foto: Das ist ein Video-Link – bitte im Feld „Video“ eintragen.'
const VIDEO_ERROR = 'Video: Bitte einen Link zu einem YouTube- oder Vimeo-Video angeben.'

function isWebAddress(text: string): boolean {
  try {
    const { protocol } = new URL(text)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

export type EventMediaResult =
  | { data: { photoUrl?: string | null; videoUrl?: string | null } }
  | { error: string }

/**
 * Validate the photo/video fields of an event create/update body. Fields that
 * are absent stay absent (partial updates); empty values become `null`.
 */
export function validateEventMedia(input: {
  photoUrl?: unknown
  videoUrl?: unknown
}): EventMediaResult {
  const data: { photoUrl?: string | null; videoUrl?: string | null } = {}

  if (input.photoUrl !== undefined) {
    const photo = typeof input.photoUrl === 'string' ? input.photoUrl.trim() : input.photoUrl
    if (photo === null || photo === '') {
      data.photoUrl = null
    } else if (typeof photo !== 'string' || photo.length > 500) {
      return { error: PHOTO_ERROR }
    } else if (UPLOADED_IMAGE_PATH.test(photo)) {
      data.photoUrl = photo
    } else if (isWebAddress(photo)) {
      if (parseVideoUrl(photo)) return { error: PHOTO_IS_VIDEO_ERROR }
      data.photoUrl = photo
    } else {
      return { error: PHOTO_ERROR }
    }
  }

  if (input.videoUrl !== undefined) {
    const video = typeof input.videoUrl === 'string' ? input.videoUrl.trim() : input.videoUrl
    if (video === null || video === '') {
      data.videoUrl = null
    } else {
      const info = typeof video === 'string' ? parseVideoUrl(video) : null
      if (!info) return { error: VIDEO_ERROR }
      data.videoUrl = info.watchUrl
    }
  }

  return { data }
}
