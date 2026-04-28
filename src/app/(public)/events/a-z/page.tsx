import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'
import { AZViewClient } from './az-view-client'

export default function AZEventsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/events" className="inline-flex items-center gap-1 text-sm text-hit-gray-500 hover:text-hit-uni-500">
          <ArrowLeft className="h-4 w-4" /> Zurück zur Übersicht
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-hit-gray-900">Studiengänge A–Z</h1>
        <p className="mt-2 text-hit-gray-600">
          Veranstaltungen alphabetisch nach Studiengang sortiert.
        </p>
      </div>
      <Suspense fallback={null}>
        <AZViewClient />
      </Suspense>
    </div>
  )
}
