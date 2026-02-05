'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventForm } from '@/components/events/EventForm'
import type { EventFormValues } from '@/lib/validations/event'

export default function NewEventPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          timeStart: data.timeStart?.toISOString(),
          timeEnd: data.timeEnd?.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create event')
      }

      const event = await response.json()
      router.push(`/admin/events/${event.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
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
      <EventForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}
