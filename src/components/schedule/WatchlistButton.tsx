'use client'

import { trackEvent } from '@/lib/analytics'
import { useSchedule } from '@/contexts/schedule-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Event } from '@/types/events'

interface WatchlistButtonProps {
  event: Event
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  className?: string
}

export function WatchlistButton({
  event,
  variant = 'outline',
  size = 'default',
  showLabel = true,
  className,
}: WatchlistButtonProps) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useSchedule()
  const { toast } = useToast()

  const watched = isInWatchlist(event.id)

  const handleClick = () => {
    if (watched) {
      removeFromWatchlist(event.id)
      trackEvent('watchlist', 'remove', event.title)
      toast({
        title: 'Entfernt',
        description: `"${event.title}" wurde aus deiner Merkliste entfernt.`,
      })
    } else {
      addToWatchlist(event)
      trackEvent('watchlist', 'add', event.title)
      toast({
        title: 'Gemerkt',
        description: `"${event.title}" wurde zu deiner Merkliste hinzugefügt.`,
      })
    }
  }

  if (size === 'icon') {
    return (
      <Button
        variant={watched ? 'secondary' : variant}
        size="icon"
        onClick={handleClick}
        className={cn(watched && 'bg-amber-100 text-amber-700 hover:bg-amber-200', className)}
        title={watched ? 'Aus Merkliste entfernen' : 'Zur Merkliste hinzufügen'}
        aria-label={watched ? 'Aus Merkliste entfernen' : 'Zur Merkliste hinzufügen'}
      >
        {watched ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      </Button>
    )
  }

  return (
    <Button
      variant={watched ? 'secondary' : variant}
      size={size}
      onClick={handleClick}
      className={cn(watched && 'bg-amber-100 text-amber-700 hover:bg-amber-200', className)}
    >
      {watched ? (
        <>
          <BookmarkCheck className="h-4 w-4 mr-2" />
          {showLabel && <span>Gemerkt</span>}
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4 mr-2" />
          {showLabel && <span>Merken</span>}
        </>
      )}
    </Button>
  )
}