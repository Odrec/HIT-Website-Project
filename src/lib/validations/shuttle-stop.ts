import { validateCoordinatePair } from '@/lib/coordinates'

export interface ShuttleStopInput {
  name: string
  latitude: number
  longitude: number
  directionsNote: string | null
}

/** Validate an admin create/update body for a shuttle stop. */
export function parseShuttleStopInput(
  body: unknown
): { data: ShuttleStopInput } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Ungültige Anfrage' }
  const { name, latitude, longitude, directionsNote } = body as Record<string, unknown>

  const trimmedName = typeof name === 'string' ? name.trim() : ''
  if (!trimmedName) return { error: 'Name ist erforderlich' }
  if (trimmedName.length > 200) return { error: 'Name darf höchstens 200 Zeichen lang sein' }

  const coordinates = validateCoordinatePair(latitude, longitude, { required: true })
  if ('error' in coordinates) return coordinates

  const note = typeof directionsNote === 'string' ? directionsNote.trim() : ''
  return {
    data: {
      name: trimmedName,
      // required: true guarantees both are numbers here
      latitude: coordinates.latitude as number,
      longitude: coordinates.longitude as number,
      directionsNote: note || null,
    },
  }
}
