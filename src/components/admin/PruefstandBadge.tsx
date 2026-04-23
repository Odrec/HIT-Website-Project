'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

const REFRESH_EVENT = 'pruefstand:refresh'

/**
 * Emit this event from anywhere in the app to trigger a badge refresh:
 *   window.dispatchEvent(new Event('pruefstand:refresh'))
 */
export function PruefstandBadge() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        const res = await fetch('/api/events/pruefstand/count', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = await res.json()
        if (controller.signal.aborted) return
        setCount(data.count ?? 0)
      } catch {
        // Leave the prior count if the fetch fails
      }
    }

    void load()
    const handler = () => void load()
    window.addEventListener(REFRESH_EVENT, handler)
    return () => {
      controller.abort()
      window.removeEventListener(REFRESH_EVENT, handler)
    }
  }, [])

  if (count === null || count === 0) return null
  return (
    <Badge variant="secondary" className="ml-auto">
      {count}
    </Badge>
  )
}
