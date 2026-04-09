'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableOfContents, type TocEntry } from './TableOfContents'

interface HelpLayoutProps {
  children: React.ReactNode
  title: string
  tocEntries: TocEntry[]
  currentRole: string
}

const roleLinks = [
  { slug: 'besucher', label: 'Besucher' },
  { slug: 'veranstalter', label: 'Veranstalter' },
  { slug: 'admin', label: 'Admin' },
]

export function HelpLayout({ children, title, tocEntries, currentRole }: HelpLayoutProps) {
  const [tocOpen, setTocOpen] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/hilfe" className="text-hit-uni-500 hover:underline">
          Hilfe
        </Link>
        <span className="mx-2">/</span>
        <span>{title}</span>
      </nav>

      <div className="flex gap-10">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24">
            <TableOfContents entries={tocEntries} />

            {/* Links to other role manuals */}
            <div className="mt-6 border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">Andere Bereiche</p>
              {roleLinks
                .filter((r) => r.slug !== currentRole)
                .map((r) => (
                  <Link
                    key={r.slug}
                    href={`/hilfe/${r.slug}`}
                    className="block text-sm text-hit-uni-500 hover:underline py-0.5"
                  >
                    {r.label} &rarr;
                  </Link>
                ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile TOC toggle */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="flex w-full items-center justify-between rounded-lg border bg-white px-4 py-2.5 text-sm font-medium"
            >
              Inhaltsverzeichnis
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', tocOpen && 'rotate-180')}
              />
            </button>
            {tocOpen && (
              <div className="mt-2 rounded-lg border bg-white p-4">
                <TableOfContents entries={tocEntries} />
              </div>
            )}
          </div>

          {/* Rendered markdown content */}
          <article className="max-w-none">{children}</article>
        </div>
      </div>
    </div>
  )
}
