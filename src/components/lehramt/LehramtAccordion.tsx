'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Disclosure section for the Lehramt page. Children are only mounted after
 * the first open, so event lists are fetched lazily.
 */
export function LehramtAccordion({ title, children }: { title: string; children: ReactNode }) {
  const [everOpened, setEverOpened] = useState(false)

  return (
    <details
      className="group rounded-md border border-hit-gray-200 bg-white"
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open) setEverOpened(true)
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-medium text-hit-gray-900 hover:bg-hit-gray-50 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-hit-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-hit-gray-100 px-4 py-4">{everOpened ? children : null}</div>
    </details>
  )
}
