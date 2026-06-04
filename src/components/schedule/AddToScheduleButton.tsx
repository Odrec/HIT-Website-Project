'use client'

import { trackEvent } from '@/lib/analytics'
import { useSchedule } from '@/contexts/schedule-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CalendarPlus, CalendarCheck, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Event } from '@/types/events'

interface AddToScheduleButtonProps {
  event: Event
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  className?: string
}

export function AddToScheduleButton({
  event,
  variant = 'default',
  size = 'default',
  showLabel = true,
  className,
}: AddToScheduleButtonProps) {
  const { addEvent, removeEvent, isInSchedule } = useSchedule()
  const { toast } = useToast()

  const inSchedule = isInSchedule(event.id)

  const handleClick = () => {
    if (inSchedule) {
      removeEvent(event.id)
      trackEvent('schedule', 'remove', event.title)
      toast({
        title: 'Entfernt',
        description: `"${event.title}" wurde aus deinem Stundenplan entfernt.`,
      })
    } else {
      addEvent(event)
      trackEvent('schedule', 'add', event.title)
      toast({
        title: 'Hinzugefügt',
        description: `"${event.title}" wurde zu deinem Stundenplan hinzugefügt.`,
      })
    }
  }

  if (size === 'icon') {
    return (
      <Button
        variant={inSchedule ? 'secondary' : variant}
        size="icon"
        onClick={handleClick}
        className={cn(inSchedule && 'bg-green-100 text-green-700 hover:bg-green-200', className)}
        title={inSchedule ? 'Aus Stundenplan entfernen' : 'Zum Stundenplan hinzufügen'}
      >
        {inSchedule ? <CalendarCheck className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
      </Button>
    )
  }

  return (
    <Button
      variant={inSchedule ? 'secondary' : variant}
      size={size}
      onClick={handleClick}
      className={cn(inSchedule && 'bg-green-100 text-green-700 hover:bg-green-200', className)}
    >
      {inSchedule ? (
        <>
          <CalendarCheck className="h-4 w-4 mr-2" />
          {showLabel && <span>Im Stundenplan</span>}
          <Check className="h-4 w-4 ml-1" />
        </>
      ) : (
        <>
          <CalendarPlus className="h-4 w-4 mr-2" />
          {showLabel && <span>In den Stundenplan</span>}
        </>
      )}
    </Button>
  )
}
