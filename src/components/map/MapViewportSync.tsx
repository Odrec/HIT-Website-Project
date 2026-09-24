'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import type { Coordinates } from '@/types/routes'

interface MapViewportSyncProps {
  /** When this changes (after mount), the map re-fits to `points`. */
  viewportKey?: string
  points: Coordinates[]
  fallbackCenter: [number, number]
  fallbackZoom: number
}

/**
 * react-leaflet only reads `center`/`zoom` on mount. This child re-fits the
 * viewport whenever the caller signals a change (e.g. campus filter), so the
 * visible map section follows the dropdown instead of only the markers.
 */
export function MapViewportSync({
  viewportKey,
  points,
  fallbackCenter,
  fallbackZoom,
}: MapViewportSyncProps) {
  const map = useMap()
  const lastKey = useRef<string | undefined>(viewportKey)

  useEffect(() => {
    if (viewportKey === lastKey.current) return
    lastKey.current = viewportKey
    if (points.length === 0) {
      map.flyTo(fallbackCenter, fallbackZoom, { duration: 0.6 })
      return
    }
    if (points.length === 1) {
      map.flyTo([points[0].latitude, points[0].longitude], 16, { duration: 0.6 })
      return
    }
    map.flyToBounds(
      points.map((p) => [p.latitude, p.longitude] as [number, number]),
      { padding: [32, 32], maxZoom: 17, duration: 0.6 }
    )
  }, [viewportKey, points, map, fallbackCenter, fallbackZoom])

  return null
}

export default MapViewportSync
