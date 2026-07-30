import { CalendarClock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/**
 * Whole calendar days from `now` until the HIT.
 *
 * `hitDate` carries Berlin wall-clock in its UTC components (the DB column is
 * `timestamp without time zone`), so both dates are truncated to their UTC
 * date parts (`startOfDay`) before subtracting. That makes the result a whole
 * number of calendar days regardless of the time of day either Date carries —
 * a raw millisecond diff would drift by the time-of-day skew between the two
 * inputs (e.g. one supplied at 23:00, the other at 00:00).
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
