import { describe, it, expect } from 'vitest'
import { parseVideoUrl } from '@/lib/video-embed'

const youtube = (id: string) => ({
  provider: 'youtube',
  providerLabel: 'YouTube',
  id,
  watchUrl: `https://www.youtube.com/watch?v=${id}`,
  embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
})

describe('parseVideoUrl', () => {
  it('reads a youtu.be share link and drops the tracking parameter', () => {
    // the exact link the ZSB pasted into the photo field
    expect(parseVideoUrl('https://youtu.be/bsA6AfLREkI?si=f_8Q5OQNIoFn0MIG')).toEqual(
      youtube('bsA6AfLREkI')
    )
  })

  it('reads the usual YouTube address forms', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=bsA6AfLREkI',
      'https://m.youtube.com/watch?feature=share&v=bsA6AfLREkI',
      'https://youtube.com/shorts/bsA6AfLREkI',
      'https://www.youtube.com/embed/bsA6AfLREkI',
      'https://www.youtube-nocookie.com/embed/bsA6AfLREkI',
      'https://www.youtube.com/live/bsA6AfLREkI',
      'youtu.be/bsA6AfLREkI',
    ]) {
      expect(parseVideoUrl(url), url).toEqual(youtube('bsA6AfLREkI'))
    }
  })

  it('reads Vimeo links, keeping the hash of unlisted videos', () => {
    expect(parseVideoUrl('https://vimeo.com/76979871')).toEqual({
      provider: 'vimeo',
      providerLabel: 'Vimeo',
      id: '76979871',
      watchUrl: 'https://vimeo.com/76979871',
      embedUrl: 'https://player.vimeo.com/video/76979871?dnt=1&autoplay=1',
    })
    expect(parseVideoUrl('https://vimeo.com/76979871/8272103f6e')).toMatchObject({
      watchUrl: 'https://vimeo.com/76979871/8272103f6e',
      embedUrl: 'https://player.vimeo.com/video/76979871?dnt=1&autoplay=1&h=8272103f6e',
    })
    expect(parseVideoUrl('https://player.vimeo.com/video/76979871?h=8272103f6e')).toMatchObject({
      watchUrl: 'https://vimeo.com/76979871/8272103f6e',
    })
  })

  it('rejects web pages and other hosts', () => {
    expect(
      parseVideoUrl(
        'https://www.hs-osnabrueck.de/veranstaltungen-ifm/2026/11/ifm-hit-hochschulinformationstag-am-institut-fuer-musik-4/'
      )
    ).toBeNull()
    expect(parseVideoUrl('https://www.youtube.com/@uniosnabrueck')).toBeNull()
    expect(parseVideoUrl('https://www.youtube.com/watch?v=too-short')).toBeNull()
    expect(parseVideoUrl('javascript:alert(1)')).toBeNull()
    expect(parseVideoUrl('')).toBeNull()
  })
})
