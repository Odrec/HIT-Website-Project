'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventForm } from '@/components/events/EventForm'
import type { EventFormValues } from '@/lib/validations/event'

interface EventData {
  id: string
  title: string
  description: string | null
  eventType: string
  timeStart: string | null
  timeEnd: string | null
  locationType: string
  locationDetails: Record<string, unknown> | null
  roomRequest: string | null
  meetingPoint: string | null
  additionalInfo: string | null
  photoUrl: string | null
  institution: string
  locationId: string | null
  isCrossProgram: boolean
  locationHint: string | null
  melderId: string | null
  buildingId: string | null
  roomId: string | null
  lecturers: {
    firstName: string
    lastName: string
    title: string | null
    email: string | null
    building: string | null
    roomNumber: string | null
    affiliation: string | null
  }[]
  organizers: {
    email: string
    phone: string | null
    internalOnly: boolean
  }[]
  studyPrograms: { studyProgramId: string }[]
  infoMarkets: { marketId: string }[]
}

export default function EditEventPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { data: session } = useSession()
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${id}`)
        if (!response.ok) {
          throw new Error('Event not found')
        }
        const data = await response.json()
        setEvent(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [id])

  const handleSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
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
        throw new Error(errorData.error || 'Failed to update event')
      }

      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/events">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Veranstaltung nicht gefunden</h1>
          </div>
        </div>
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <p>Die angeforderte Veranstaltung konnte nicht gefunden werden.</p>
        </div>
      </div>
    )
  }

  // Transform event data to form values
  const initialData: Partial<EventFormValues> & { id: string } = {
    id: event.id,
    title: event.title,
    description: event.description || '',
    eventType: event.eventType as EventFormValues['eventType'],
    timeStart: event.timeStart ? new Date(event.timeStart) : null,
    timeEnd: event.timeEnd ? new Date(event.timeEnd) : null,
    locationType: event.locationType as EventFormValues['locationType'],
    locationDetails: event.locationDetails || undefined,
    roomRequest: event.roomRequest || '',
    meetingPoint: event.meetingPoint || '',
    additionalInfo: event.additionalInfo || '',
    photoUrl: event.photoUrl || '',
    institution: event.institution as EventFormValues['institution'],
    locationId: event.locationId || '',
    lecturers: event.lecturers.map((l) => ({
      firstName: l.firstName,
      lastName: l.lastName,
      title: l.title || '',
      email: l.email || '',
      affiliation: (l.affiliation as 'UNI' | 'HOCHSCHULE' | 'EXTERN') || '',
    })),
    organizers: event.organizers.map((o) => ({
      email: o.email,
      phone: o.phone || '',
      internalOnly: o.internalOnly,
    })),
    studyProgramIds: event.studyPrograms.map((sp) => sp.studyProgramId),
    infoMarketIds: event.infoMarkets.map((im) => im.marketId),
    isCrossProgram: event.isCrossProgram ?? false,
    locationHint: event.locationHint || '',
    melderId: event.melderId || '',
    buildingId: event.buildingId || '',
    roomId: event.roomId || '',
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
          <h1 className="text-2xl font-bold text-gray-900">Veranstaltung bearbeiten</h1>
          <p className="text-gray-500">{event.title}</p>
        </div>
      </div>

      {/* Success message */}
      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-green-900">Änderungen erfolgreich gespeichert</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => router.push('/admin/events')}>
                OK
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSaved(false)}>
                Weiter bearbeiten
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <p className="font-medium">Fehler beim Speichern</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <EventForm initialData={initialData} onSubmit={handleSubmit} isSubmitting={isSubmitting} isAdmin={session?.user?.role === 'ADMIN'} />
    </div>
  )
}
