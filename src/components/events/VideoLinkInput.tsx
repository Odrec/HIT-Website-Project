'use client'

import { CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseVideoUrl } from '@/lib/video-embed'

interface VideoLinkInputProps {
  value: string
  onChange: (value: string) => void
}

/** Video link field of the event form (YouTube or Vimeo). */
export function VideoLinkInput({ value, onChange }: VideoLinkInputProps) {
  const trimmed = value.trim()
  const video = trimmed ? parseVideoUrl(trimmed) : null

  return (
    <div className="space-y-1.5">
      <Label htmlFor="videoUrl">Video (YouTube oder Vimeo)</Label>
      <Input
        id="videoUrl"
        type="url"
        inputMode="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="z.B. https://youtu.be/…"
        aria-invalid={Boolean(trimmed && !video)}
      />
      {trimmed && video && (
        <p className="flex items-center gap-1 text-xs text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {video.providerLabel}-Video erkannt
        </p>
      )}
      {trimmed && !video && (
        <p role="alert" className="text-xs text-red-600">
          Bitte einen Link zu einem YouTube- oder Vimeo-Video angeben.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Link aus der Adresszeile oder über „Teilen“ kopieren. Auf der Veranstaltungsseite wird das
        Video erst nach einem Klick geladen.
      </p>
    </div>
  )
}
