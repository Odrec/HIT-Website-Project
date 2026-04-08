'use client'

import { cn } from '@/lib/utils'

export interface TocEntry {
  id: string
  text: string
}

interface TableOfContentsProps {
  entries: TocEntry[]
  activeId?: string
}

export function TableOfContents({ entries, activeId }: TableOfContentsProps) {
  return (
    <nav aria-label="Inhaltsverzeichnis">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Inhalt
      </p>
      <ul className="space-y-1">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className={cn(
                'block rounded-md px-3 py-1.5 text-sm transition-colors',
                activeId === entry.id
                  ? 'bg-hit-uni-50 font-medium text-hit-uni-600'
                  : 'text-muted-foreground hover:bg-hit-gray-100 hover:text-hit-gray-900'
              )}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
