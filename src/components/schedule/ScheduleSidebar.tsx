'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import Link from 'next/link'
import { useSchedule } from '@/contexts/schedule-context'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Calendar,
  Clock,
  AlertTriangle,
  Trash2,
  X,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'

interface ScheduleSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

// Event type badge colors
const eventTypeColors: Record<string, string> = {
  VORTRAG: 'bg-blue-100 text-blue-800',
  LABORFUEHRUNG: 'bg-purple-100 text-purple-800',
  RUNDGANG: 'bg-green-100 text-green-800',
  WORKSHOP: 'bg-orange-100 text-orange-800',
  LINK: 'bg-gray-100 text-gray-800',
  INFOSTAND: 'bg-pink-100 text-pink-800',
}

export function ScheduleSidebar({
  isOpen,
  onClose,
  className,
}: ScheduleSidebarProps) {
  const { state, removeEvent, clearSchedule, getConflicts } = useSchedule()
  const conflicts = getConflicts()

  // Sort events by time
  const sortedItems = [...state.items].sort((a, b) => {
    if (!a.event.timeStart) return 1
    if (!b.event.timeStart) return -1
    return new Date(a.event.timeStart).getTime() - new Date(b.event.timeStart).getTime()
  })

  const handleRemove = (eventId: string) => {
    removeEvent(eventId)
  }

  const handleClear = () => {
    if (confirm('Möchtest du wirklich alle Events aus deinem Zeitplan entfernen?')) {
      clearSchedule()
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-background shadow-xl z-50 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Mein Zeitplan</h2>
            {state.items.length > 0 && (
              <Badge variant="secondary">{state.items.length}</Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4" style={{ height: 'calc(100% - 140px)' }}>
          {state.items.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Dein Zeitplan ist leer</p>
              <p className="text-sm text-muted-foreground mt-2">
                Füge Events hinzu, um deinen persönlichen Zeitplan zu erstellen
              </p>
              <Button asChild className="mt-4">
                <Link href="/events">Events durchsuchen</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Conflict warning */}
              {conflicts.length > 0 && (
                <Card className="border-yellow-500 bg-yellow-50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium text-sm">
                        {conflicts.length} Zeitkonflikt{conflicts.length > 1 ? 'e' : ''}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Event list */}
              {sortedItems.map((item) => {
                const hasConflict = conflicts.some(
                  (c) =>
                    c.event1.eventId === item.eventId ||
                    c.event2.eventId === item.eventId
                )

                return (
                  <Card
                    key={item.id}
                    className={cn(
                      'transition-all',
                      hasConflict && 'ring-2 ring-yellow-500'
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-grow min-w-0">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs mb-1',
                              eventTypeColors[item.event.eventType]
                            )}
                          >
                            {item.event.eventType}
                          </Badge>
                          <Link
                            href={`/events/${item.event.id}`}
                            className="block font-medium text-sm hover:underline line-clamp-2"
                            onClick={onClose}
                          >
                            {item.event.title}
                          </Link>
                          {item.event.timeStart && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(new Date(item.event.timeStart), 'HH:mm', {
                                  locale: de,
                                })}
                                {item.event.timeEnd && (
                                  <>
                                    {' - '}
                                    {format(new Date(item.event.timeEnd), 'HH:mm', {
                                      locale: de,
                                    })}
                                  </>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {hasConflict && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleRemove(item.eventId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <div className="flex gap-2">
            {state.items.length > 0 && (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClear}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Leeren
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/schedule" onClick={onClose}>
                    Zeitplan anzeigen
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Floating schedule button component
interface ScheduleFloatingButtonProps {
  onClick: () => void
  className?: string
}

export function ScheduleFloatingButton({
  onClick,
  className,
}: ScheduleFloatingButtonProps) {
  const { state, getConflicts } = useSchedule()
  const hasConflicts = getConflicts().length > 0

  if (!state.isLoaded || state.items.length === 0) {
    return null
  }

  return (
    <Button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 h-14 rounded-full shadow-lg z-30',
        hasConflicts && 'bg-yellow-500 hover:bg-yellow-600',
        className
      )}
    >
      <Calendar className="h-5 w-5 mr-2" />
      <span>Zeitplan</span>
      <Badge
        variant={hasConflicts ? 'destructive' : 'secondary'}
        className="ml-2"
      >
        {state.items.length}
      </Badge>
      {hasConflicts && (
        <AlertTriangle className="h-4 w-4 ml-1" />
      )}
    </Button>
  )
}
