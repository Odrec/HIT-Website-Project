'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { HelpLink } from '@/components/help/HelpLink'
import { shouldShowMultiplikatorCafeLink } from '@/lib/multiplikator-cafe'

interface Cluster {
  id: string
  name: string
  institution: 'UNI' | 'HOCHSCHULE'
}

interface MultiplikatorCafe {
  eventId: string | null
}

function EventsLandingContent() {
  const router = useRouter()
  const [uniClusters, setUniClusters] = useState<Cluster[]>([])
  const [hsClusters, setHsClusters] = useState<Cluster[]>([])
  const [multiplikatorCafe, setMultiplikatorCafe] = useState<MultiplikatorCafe>({ eventId: null })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/clusters')
      .then((r) => {
        if (!r.ok) throw new Error(`/api/clusters returned ${r.status}`)
        return r.json()
      })
      .then((data) => {
        // Stable display order: keep DB ordering. The Lehramt cluster (Uni)
        // is appended last so it visually anchors as the 6th tile.
        const lehramt = data.uni.find((c: Cluster) => c.name === 'Lehramt')
        const others = data.uni.filter((c: Cluster) => c.name !== 'Lehramt')
        setUniClusters(lehramt ? [...others, lehramt] : data.uni)
        setHsClusters(data.hochschule)
      })
      .catch((e) => console.error('clusters fetch failed', e))

    fetch('/api/multiplikator-cafe')
      .then((r) => r.json())
      .then((data) => setMultiplikatorCafe(data))
      .catch(() => setMultiplikatorCafe({ eventId: null }))
  }, [])

  const onSearchSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/events/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-hit-gray-900">Veranstaltungen</h1>
          <HelpLink href="/hilfe/besucher#veranstaltungen" />
        </div>
        <p className="mt-2 text-hit-gray-600">
          Entdecken Sie alle Veranstaltungen des Hochschulinfotags 2026
        </p>
      </div>

      <form onSubmit={onSearchSubmit} className="mb-8 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hit-gray-400" />
          <Input
            type="text"
            placeholder="Suchen nach Titel, Beschreibung, Dozierende, Studiengang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      <section className="mb-8">
        <h2 className="mb-3 border-b-2 border-hit-uni-500 pb-1 text-sm font-bold uppercase tracking-wide text-hit-uni-600">
          Studienfelder · Universität
        </h2>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {uniClusters.map((c) => (
            <Link
              key={c.id}
              href={`/events/cluster/${c.id}`}
              className="block rounded-md border border-hit-gray-200 border-l-4 border-l-hit-uni-500 bg-hit-gray-50 px-4 py-3 text-sm text-hit-gray-900 transition-colors hover:bg-hit-gray-100"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 border-b-2 border-hit-hs-500 pb-1 text-sm font-bold uppercase tracking-wide text-hit-hs-600">
          Studienfelder · Hochschule
        </h2>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {hsClusters.map((c) => (
            <Link
              key={c.id}
              href={`/events/cluster/${c.id}`}
              className="block rounded-md border border-hit-gray-200 border-l-4 border-l-hit-hs-500 bg-hit-gray-50 px-4 py-3 text-sm text-hit-gray-900 transition-colors hover:bg-hit-gray-100"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <LandingLink href="/events/lehramt" label="Lehramt" />
          <LandingLink href="/events/a-z" label="Studiengänge A-Z" />
          <LandingLink href="/events/infomaerkte" label="Infomärkte" />
          <LandingLink href="/events/rund-ums-studium" label="Rund ums Studium" />
          {shouldShowMultiplikatorCafeLink(multiplikatorCafe.eventId) && (
            <LandingLink
              href={`/events/${multiplikatorCafe.eventId}`}
              label="Multiplikator*innen-Café"
            />
          )}
        </div>
      </section>
    </>
  )
}

function LandingLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md border border-hit-gray-200 bg-white px-4 py-3 text-sm text-hit-gray-900 transition-colors hover:border-hit-uni-300"
    >
      <span>{label}</span>
      <span className="text-hit-gray-400">→</span>
    </Link>
  )
}

export default function PublicEventsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={null}>
        <EventsLandingContent />
      </Suspense>
    </div>
  )
}
