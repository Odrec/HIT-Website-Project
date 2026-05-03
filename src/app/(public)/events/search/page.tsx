'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EventListView } from '@/components/events/EventListView'

function SearchContent() {
  const params = useSearchParams()
  const q = params.get('q') ?? ''
  return (
    <>
      <div className="mb-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-1 text-sm text-hit-gray-500 hover:text-hit-uni-500"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück zur Übersicht
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-hit-gray-900">Suchergebnisse</h1>
        {q && <p className="mt-2 text-hit-gray-600">Treffer für &bdquo;{q}&ldquo;</p>}
      </div>
      <EventListView initialSearch={q} />
    </>
  )
}

export default function EventSearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={null}>
        <SearchContent />
      </Suspense>
    </div>
  )
}
