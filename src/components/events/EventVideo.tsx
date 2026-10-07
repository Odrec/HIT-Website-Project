'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseVideoUrl } from '@/lib/video-embed'

interface EventVideoProps {
  url: string
  title: string
}

/**
 * Click-to-load video player (two-click solution): nothing is requested from
 * YouTube/Vimeo until the visitor presses "Video abspielen".
 */
export function EventVideo({ url, title }: EventVideoProps) {
  const [playing, setPlaying] = useState(false)
  const video = parseVideoUrl(url)
  if (!video) return null

  return (
    <div className="space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-hit-gray-900">
        {playing ? (
          <iframe
            src={video.embedUrl}
            title={`Video: ${title}`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
            <Button
              type="button"
              size="lg"
              className="bg-white text-hit-gray-900 hover:bg-white/90"
              onClick={() => setPlaying(true)}
            >
              <Play className="mr-2 h-5 w-5" />
              Video abspielen
            </Button>
            <p className="max-w-md text-xs text-white/80">
              Beim Abspielen wird das Video von {video.providerLabel} geladen. Dabei werden Daten
              (u. a. Ihre IP-Adresse) an {video.providerLabel} übertragen. Mehr dazu in der{' '}
              <Link href="/datenschutz" className="underline hover:text-white">
                Datenschutzerklärung
              </Link>
              .
            </p>
          </div>
        )}
      </div>
      <a
        href={video.watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-hit-uni-500 hover:underline"
      >
        Auf {video.providerLabel} ansehen
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}
