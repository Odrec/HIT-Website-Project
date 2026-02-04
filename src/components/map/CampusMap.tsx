'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type {
  BuildingInfo,
  Route,
  Coordinates,
  RouteWaypoint,
  TravelTimeAnalysis,
} from '@/types/routes'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamic import for Leaflet (no SSR)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)

interface CampusMapProps {
  buildings?: BuildingInfo[]
  route?: Route
  travelAnalyses?: TravelTimeAnalysis[]
  selectedBuilding?: string
  currentLocation?: Coordinates
  onBuildingClick?: (building: BuildingInfo) => void
  className?: string
  showAllBuildings?: boolean
  showRoute?: boolean
  height?: string
}

// Default center (Osnabrück)
const DEFAULT_CENTER: [number, number] = [52.2799, 8.0472]
const DEFAULT_ZOOM = 14

export default function CampusMap({
  buildings = [],
  route,
  travelAnalyses = [],
  selectedBuilding,
  currentLocation,
  onBuildingClick,
  className = '',
  showAllBuildings = true,
  showRoute = true,
  height = '500px',
}: CampusMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [leaflet, setLeaflet] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    // Import Leaflet CSS and library on client side
    import('leaflet').then((L) => {
      setLeaflet(L)
      // Fix for default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
    })
  }, [])

  if (!isClient || !leaflet) {
    return (
      <div className={className} style={{ height }}>
        <Skeleton className="w-full h-full" />
      </div>
    )
  }

  // Calculate center based on buildings or route
  let center = DEFAULT_CENTER
  if (route && route.waypoints.length > 0) {
    const avgLat =
      route.waypoints.reduce((sum, wp) => sum + wp.coordinates.latitude, 0) /
      route.waypoints.length
    const avgLng =
      route.waypoints.reduce((sum, wp) => sum + wp.coordinates.longitude, 0) /
      route.waypoints.length
    center = [avgLat, avgLng]
  } else if (buildings.length > 0) {
    const avgLat =
      buildings.reduce((sum, b) => sum + b.coordinates.latitude, 0) /
      buildings.length
    const avgLng =
      buildings.reduce((sum, b) => sum + b.coordinates.longitude, 0) /
      buildings.length
    center = [avgLat, avgLng]
  }

  // Create custom icons
  const buildingIcon = leaflet.divIcon({
    className: 'custom-marker',
    html: `<div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white">🏛️</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })

  const eventIcon = leaflet.divIcon({
    className: 'custom-marker',
    html: `<div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white">📍</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })

  const currentLocationIcon = leaflet.divIcon({
    className: 'custom-marker',
    html: `<div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white animate-pulse">📍</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })

  // Get route polyline coordinates
  const routeCoordinates: [number, number][] = route
    ? route.waypoints.map((wp) => [wp.coordinates.latitude, wp.coordinates.longitude])
    : []

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        integrity="sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw=="
        crossOrigin="anonymous"
      />
      <div className={className} style={{ height }}>
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Current location marker */}
          {currentLocation && (
            <Marker
              position={[currentLocation.latitude, currentLocation.longitude]}
              icon={currentLocationIcon}
            >
              <Popup>
                <div className="text-center">
                  <strong>Ihr Standort</strong>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Building markers */}
          {showAllBuildings &&
            buildings.map((building) => (
              <Marker
                key={building.id}
                position={[
                  building.coordinates.latitude,
                  building.coordinates.longitude,
                ]}
                icon={buildingIcon}
                eventHandlers={{
                  click: () => onBuildingClick?.(building),
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h3 className="font-bold text-lg">{building.name}</h3>
                    {building.shortName && (
                      <p className="text-sm text-gray-500">({building.shortName})</p>
                    )}
                    <p className="text-sm mt-1">{building.address}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          building.campus === 'schloss'
                            ? 'bg-purple-100 text-purple-800'
                            : building.campus === 'westerberg'
                            ? 'bg-blue-100 text-blue-800'
                            : building.campus === 'caprivi'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {building.campus === 'schloss'
                          ? 'Schloss'
                          : building.campus === 'westerberg'
                          ? 'Westerberg'
                          : building.campus === 'caprivi'
                          ? 'Caprivi (HS)'
                          : 'Haste (HS)'}
                      </span>
                      {building.hasAccessibility && (
                        <span className="text-green-600" title="Barrierefrei">
                          ♿
                        </span>
                      )}
                    </div>
                    {building.eventCount !== undefined && building.eventCount > 0 && (
                      <p className="mt-2 text-sm">
                        <strong>{building.eventCount}</strong> Veranstaltung(en)
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Route waypoint markers */}
          {route &&
            route.waypoints.map((waypoint, index) => (
              <Marker
                key={`wp-${waypoint.id}-${index}`}
                position={[
                  waypoint.coordinates.latitude,
                  waypoint.coordinates.longitude,
                ]}
                icon={eventIcon}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <h3 className="font-bold">{waypoint.name}</h3>
                    </div>
                    {waypoint.eventTitle && (
                      <p className="text-sm text-gray-600">{waypoint.eventTitle}</p>
                    )}
                    {waypoint.timeStart && (
                      <p className="text-sm mt-1">
                        {new Date(waypoint.timeStart).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {waypoint.timeEnd &&
                          ` - ${new Date(waypoint.timeEnd).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Route polylines - colored by travel analysis status */}
          {showRoute && routeCoordinates.length >= 2 && (
            <>
              {routeCoordinates.slice(0, -1).map((coord, index) => {
                const nextCoord = routeCoordinates[index + 1]
                // Check if this segment has a warning
                const analysis = travelAnalyses[index]
                const hasWarning = analysis && analysis.status !== 'ok'
                const segmentColor = hasWarning ? '#dc2626' : '#2563eb' // Red for warnings, blue for ok
                
                return (
                  <Polyline
                    key={`segment-${index}`}
                    positions={[coord, nextCoord]}
                    pathOptions={{
                      color: segmentColor,
                      weight: hasWarning ? 5 : 4,
                      opacity: hasWarning ? 1 : 0.8,
                      dashArray: hasWarning ? undefined : '10, 10',
                    }}
                  />
                )
              })}
            </>
          )}
        </MapContainer>
      </div>
    </>
  )
}
