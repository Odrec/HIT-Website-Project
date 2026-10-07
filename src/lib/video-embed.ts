/**
 * Video links on events (YouTube, Vimeo).
 *
 * The event page embeds the player only after the visitor clicks (two-click
 * solution), so no data reaches YouTube/Vimeo on page load. The embed URLs use
 * the privacy-friendly variants (youtube-nocookie.com, Vimeo `dnt=1`) and
 * autoplay, since the click already expressed the wish to watch.
 */

export interface VideoInfo {
  provider: 'youtube' | 'vimeo'
  providerLabel: 'YouTube' | 'Vimeo'
  id: string
  /** Canonical link — what we store and what "Auf YouTube ansehen" opens. */
  watchUrl: string
  /** Player URL for the iframe. */
  embedUrl: string
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
])
const YOUTUBE_PATH_PREFIXES = ['/shorts/', '/embed/', '/live/']

function youtube(id: string): VideoInfo | null {
  if (!YOUTUBE_ID.test(id)) return null
  return {
    provider: 'youtube',
    providerLabel: 'YouTube',
    id,
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
  }
}

function vimeo(id: string, hash: string | null): VideoInfo | null {
  if (!/^\d+$/.test(id)) return null
  if (hash !== null && !/^[0-9a-f]+$/i.test(hash)) return null
  return {
    provider: 'vimeo',
    providerLabel: 'Vimeo',
    id,
    watchUrl: hash ? `https://vimeo.com/${id}/${hash}` : `https://vimeo.com/${id}`,
    embedUrl: `https://player.vimeo.com/video/${id}?dnt=1&autoplay=1${hash ? `&h=${hash}` : ''}`,
  }
}

/** Recognise a YouTube or Vimeo link; `null` for anything else. */
export function parseVideoUrl(input: string): VideoInfo | null {
  const text = input.trim()
  if (!text) return null

  let url: URL
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const host = url.hostname.toLowerCase()
  const segments = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be') return segments.length === 1 ? youtube(segments[0]) : null
  if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === '/watch') return youtube(url.searchParams.get('v') ?? '')
    const prefix = YOUTUBE_PATH_PREFIXES.find((p) => url.pathname.startsWith(p))
    return prefix && segments.length === 2 ? youtube(segments[1]) : null
  }

  if (host === 'player.vimeo.com') {
    return segments[0] === 'video' && segments.length === 2
      ? vimeo(segments[1], url.searchParams.get('h'))
      : null
  }
  if (host === 'vimeo.com' || host === 'www.vimeo.com') {
    // vimeo.com/<id>, vimeo.com/<id>/<hash>, vimeo.com/channels/<name>/<id>
    const idIndex = segments.findIndex((s) => /^\d+$/.test(s))
    if (idIndex === -1) return null
    return vimeo(segments[idIndex], segments[idIndex + 1] ?? null)
  }

  return null
}
