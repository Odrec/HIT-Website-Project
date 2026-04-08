import { format } from 'date-fns'

interface CalendarEvent {
  title: string
  description: string | null
  timeStart: Date
  timeEnd: Date
  location: {
    buildingName: string
    roomNumber?: string | null
  } | null
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startStr = format(event.timeStart, "yyyyMMdd'T'HHmmss")
  const endStr = format(event.timeEnd, "yyyyMMdd'T'HHmmss")

  // Build most params via URLSearchParams for correct encoding, but inject the
  // dates value manually so the slash separator is NOT percent-encoded (%2F).
  const params = new URLSearchParams()
  params.set('action', 'TEMPLATE')
  params.set('text', event.title)

  if (event.location) {
    const locationParts = [event.location.buildingName]
    if (event.location.roomNumber) {
      locationParts.push(event.location.roomNumber)
    }
    params.set('location', locationParts.join(', '))
  }

  if (event.description) {
    params.set('details', event.description)
  }

  // Append dates with a raw slash after the other encoded params
  const query = `${params.toString()}&dates=${startStr}/${endStr}`
  return `https://calendar.google.com/calendar/render?${query}`
}
