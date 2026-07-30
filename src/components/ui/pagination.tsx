'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * The page numbers to render, with 'gap' marking an elided range. First and
 * last page are always present so the end of the list is always reachable.
 * Always respects maxSlots: the total of numbers + gaps never exceeds it.
 * Gaps only appear where they hide 2+ pages; single skipped pages are shown.
 */
export function pageWindow(page: number, totalPages: number, maxSlots = 7): Array<number | 'gap'> {
  if (totalPages <= maxSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  // Must include: 1, totalPages, page, page±1 (if they exist)
  const pages = new Set<number>([1, totalPages, page])
  pages.add(Math.max(1, page - 1))
  pages.add(Math.min(totalPages, page + 1))

  // Expand outward from current page, respecting slot budget (numbers + gaps)
  let offset = 2
  while (offset < totalPages) {
    // Collect candidates to test
    const candidates = new Set(pages)
    if (page - offset >= 1) candidates.add(page - offset)
    if (page + offset <= totalPages) candidates.add(page + offset)

    // Count slots this set would render to (numbers + gaps)
    const sorted = Array.from(candidates).sort((a, b) => a - b)
    let gaps = 0
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] > 1) gaps++
    }

    if (sorted.length + gaps > maxSlots) {
      // Would exceed budget; stop expanding
      break
    }

    pages.clear()
    candidates.forEach((p) => pages.add(p))
    offset++
  }

  // Build output with gaps, then replace single-page-eliding gaps with numbers
  const sorted = Array.from(pages).sort((a, b) => a - b)
  const out: Array<number | 'gap'> = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('gap')
    out.push(sorted[i])
  }

  // Replace gaps that hide exactly one page with that page number
  for (let i = 0; i < out.length; i++) {
    if (out[i] === 'gap') {
      const beforeVal = out[i - 1]
      const afterVal = out[i + 1]
      const before = typeof beforeVal === 'number' ? beforeVal : 0
      const after = typeof afterVal === 'number' ? afterVal : 0
      if (after - before === 2) {
        // Gap hides exactly one page; replace it
        out[i] = before + 1
      }
    }
  }

  return out
}

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  /** Plural noun for the summary line. */
  itemLabel?: string
  /** Suppress the summary line when a parent already shows the count. */
  hideSummary?: boolean
  onPageChange: (page: number) => void
  /**
   * Applied to the component's own root, not a wrapper the caller renders —
   * since the component returns null for a single page, spacing passed here
   * never leaves a stray gap the way a caller-side wrapper div would.
   */
  className?: string
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  itemLabel = 'Veranstaltungen',
  hideSummary = false,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const go = (p: number) => onPageChange(Math.min(totalPages, Math.max(1, p)))

  return (
    <nav
      className={cn('flex flex-col items-center gap-3 sm:flex-row sm:justify-between', className)}
      aria-label="Blätterung"
    >
      {!hideSummary && (
        <p className="text-sm font-medium text-hit-gray-900">
          Seite {page} von {totalPages}
          <span className="font-normal text-gray-500">
            {' '}
            · {totalItems} {itemLabel}
          </span>
        </p>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => go(page - 1)}
          disabled={page === 1}
          aria-label="Vorherige Seite"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Numbers are the discoverability fix, but they must not wrap on a
            phone — below sm only a compact indicator is shown. */}
        <div className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, totalPages).map((slot, i) =>
            slot === 'gap' ? (
              <span key={`gap-${i}`} className="px-1 text-gray-400" aria-hidden="true">
                …
              </span>
            ) : (
              <Button
                key={slot}
                variant={slot === page ? 'uni' : 'outline'}
                size="icon"
                aria-current={slot === page ? 'page' : undefined}
                onClick={() => go(slot)}
                className={cn('min-w-9', slot === page && 'pointer-events-none')}
              >
                {slot}
              </Button>
            )
          )}
        </div>
        <span className="px-2 text-sm text-gray-600 sm:hidden">
          {page} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={() => go(page + 1)}
          disabled={page === totalPages}
          aria-label="Nächste Seite"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
