'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface EventPhotoProps {
  src: string
  alt: string
  /** Sizing classes for the frame, e.g. `h-40`. */
  className?: string
  sizes: string
}

/**
 * Event photo that removes itself when the image cannot be loaded (e.g. an
 * external address that is a web page, or a deleted file) instead of showing a
 * broken-image frame to visitors.
 */
export function EventPhoto({ src, alt, className, sizes }: EventPhotoProps) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
