'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ChevronLeft, CheckCircle2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventForm } from '@/components/events/EventForm'
import type { EventFormValues } from '@/lib/validations/event'
import { formatEventTime } from '@/lib/event-time'

const EVENT_TYPE_LABELS: Record<string, string> = {
  VORTRAG: 'Vortrag',
  WORKSHOP: 'Workshop',
  FUEHRUNG: 'Laborführung',
  BERATUNG: 'Beratung',
  INFOSTAND: 'Infostand',
  RUNDGANG: 'Rundgang',
  SONSTIGES: 'Sonstiges',
}

const INSTITUTION_LABELS: Record<string, string> = {
  UNI: 'Universität Osnabrück',
  HS: 'Hochschule Osnabrück',
  BOTH: 'Universität & Hochschule Osnabrück',
}

interface CreatedEvent {
  id: string
  title: string
  eventType: string
  institution: string
  timeStart: string | null
  timeEnd: string | null
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return formatEventTime(iso)
}

export default function NewEventPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null)

  const handleSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          isCrossProgram: data.isCrossProgram ?? false,
          locationHint: data.locationHint || null,
          melderId: data.melderId || null,
          buildingId: data.buildingId || null,
          roomId: data.roomId || null,
          timeStart: data.timeStart?.toISOString(),
          timeEnd: data.timeEnd?.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create event')
      }

      const event = await response.json()
      setCreatedEvent(event)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (createdEvent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/events">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Veranstaltung erstellt</h1>
          </div>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-3 flex-1">
              <div>
                <h2 className="text-lg font-semibold text-green-900">
                  Veranstaltung erfolgreich erstellt
                </h2>
                <p className="text-sm text-green-700 mt-1">
                  Die Veranstaltung wurde erfolgreich gespeichert.
                </p>
              </div>

              <div className="rounded-md bg-white border border-green-100 p-4 space-y-2">
                <h3 className="font-semibold text-gray-900">{createdEvent.title}</h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-gray-600">
                  <dt className="font-medium">Typ:</dt>
                  <dd>{EVENT_TYPE_LABELS[createdEvent.eventType] ?? createdEvent.eventType}</dd>
                  <dt className="font-medium">Institution:</dt>
                  <dd>
                    {INSTITUTION_LABELS[createdEvent.institution] ?? createdEvent.institution}
                  </dd>
                  <dt className="font-medium">Beginn:</dt>
                  <dd>{formatTime(createdEvent.timeStart)}</dd>
                  <dt className="font-medium">Ende:</dt>
                  <dd>{formatTime(createdEvent.timeEnd)}</dd>
                </dl>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={() => router.push('/admin/events')}>OK</Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/events/${createdEvent.id}`)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Bearbeiten
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/events">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Neue Veranstaltung erstellen</h1>
          <p className="text-gray-500">
            Füllen Sie das Formular aus, um eine neue Veranstaltung zu erstellen.
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <p className="font-medium">Fehler beim Erstellen</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <EventForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isAdmin={session?.user?.role === 'ADMIN'}
      />
    </div>
  )
}
