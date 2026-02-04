'use client'

import { MapPin, Clock, Footprints, Navigation } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Route, RouteLeg } from '@/types/routes'

interface RouteInfoProps {
  route?: Route | null
  className?: string
}

export default function RouteInfo({ route, className = '' }: RouteInfoProps) {
  if (!route || route.waypoints.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-4">
          <p className="text-gray-500 text-center py-4">
            Keine Route berechnet. Fügen Sie Veranstaltungen zu Ihrem Zeitplan hinzu.
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.round(seconds / 60)
    if (mins < 60) {
      return `${mins} Min.`
    }
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          Routenübersicht
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <MapPin className="h-5 w-5 mx-auto text-gray-500 mb-1" />
            <p className="text-lg font-bold">{route.waypoints.length}</p>
            <p className="text-xs text-gray-500">Stationen</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <Footprints className="h-5 w-5 mx-auto text-gray-500 mb-1" />
            <p className="text-lg font-bold">{formatDistance(route.totalDistance)}</p>
            <p className="text-xs text-gray-500">Gesamt</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 mx-auto text-gray-500 mb-1" />
            <p className="text-lg font-bold">{formatTime(route.totalDuration)}</p>
            <p className="text-xs text-gray-500">Gehzeit</p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Route legs */}
        <div className="space-y-2">
          {route.waypoints.map((waypoint, index) => (
            <div key={`${waypoint.id}-${index}`} className="relative">
              {/* Waypoint */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      waypoint.type === 'current_location'
                        ? 'bg-green-600 text-white'
                        : 'bg-primary text-white'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < route.waypoints.length - 1 && (
                    <div className="w-0.5 h-12 bg-gray-300 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className="font-medium">{waypoint.name}</p>
                  {waypoint.eventTitle && (
                    <p className="text-sm text-gray-600">{waypoint.eventTitle}</p>
                  )}
                  {waypoint.timeStart && (
                    <p className="text-sm text-gray-500">
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
              </div>

              {/* Leg info */}
              {index < route.legs.length && (
                <div className="ml-11 mb-2 -mt-10 text-xs text-gray-500 flex items-center gap-2">
                  <Footprints className="h-3 w-3" />
                  <span>
                    {formatDistance(route.legs[index].distance)} •{' '}
                    {formatTime(route.legs[index].duration)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Warnings summary */}
        {route.hasWarnings && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 flex items-center gap-2">
              <span>⚠️</span>
              {route.warnings.length} Warnung(en) auf dieser Route
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
