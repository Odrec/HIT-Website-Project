import { CalendarClock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/**
 * Whole calendar days from `now` until the HIT.
 *
 * Both dates carry Berlin wall-clock in their UTC components (the DB column is
 * `timestamp without time zone`), so the difference is taken from UTC date
 * parts only. Dividing milliseconds would be off by one across a DST switch.
 */
export function daysUntilHit(hitDate: Date, now: Date): number {
  const startOfDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  return Math.round((startOfDay(hitDate) - startOfDay(now)) / 86_400_000)
}

export function HitCountdown({ hitDate }: { hitDate: Date | string | null }) {
  if (!hitDate) return null

  const days = daysUntilHit(new Date(hitDate), new Date())
  if (days < 0) return null

  return (
    <Badge className="bg-white/20 text-white hover:bg-white/30">
      <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
      {days === 0 ? 'Heute ist HIT!' : `Noch ${days} Tage bis zum HIT`}
    </Badge>
  )
}
