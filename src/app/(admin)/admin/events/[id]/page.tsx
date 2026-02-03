'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
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
  lecturers: {
    firstName: string
    lastName: string
    title: string | null
    email: string | null
    building: string | null
    roomNumber: string | null
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
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          timeStart: data.timeStart?.toISOString(),
          timeEnd: data.timeEnd?.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update event')
      }

      router.push('/admin/events')
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
            <h1 className="text-2xl font-bold text-gray-900">
              Veranstaltung nicht gefunden
            </h1>
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
      building: l.building || '',
      roomNumber: l.roomNumber || '',
    })),
    organizers: event.organizers.map((o) => ({
      email: o.email,
      phone: o.phone || '',
      internalOnly: o.internalOnly,
    })),
    studyProgramIds: event.studyPrograms.map((sp) => sp.studyProgramId),
    infoMarketIds: event.infoMarkets.map((im) => im.marketId),
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
          <h1 className="text-2xl font-bold text-gray-900">
            Veranstaltung bearbeiten
          </h1>
          <p className="text-gray-500">{event.title}</p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <p className="font-medium">Fehler beim Speichern</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <EventForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
