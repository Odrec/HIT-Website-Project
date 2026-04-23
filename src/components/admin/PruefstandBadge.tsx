'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

export function PruefstandBadge() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/events/pruefstand/count')
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((data) => {
        if (!cancelled) setCount(data.count ?? 0)
      })
      .catch(() => {
        if (!cancelled) setCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (count === null || count === 0) return null
  return (
    <Badge variant="secondary" className="ml-auto">
      {count}
    </Badge>
  )
}
