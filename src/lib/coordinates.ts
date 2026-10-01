/**
 * Coordinate input helpers for the admin forms (buildings, shuttle stops) and
 * the matching server-side validation.
 *
 * The admin fields are plain text inputs, not `type="number"`: a number input
 * shows its placeholder like a value that cannot be selected, and its spinner /
 * arrow keys turn an empty field into -1 or 1 — which is how a building ended
 * up at -1 / 1. Text input also lets admins type the German decimal comma and
 * paste a "lat, lng" pair straight from Google Maps.
 */

export type CoordinateAxis = 'latitude' | 'longitude'

const AXIS = {
  latitude: { label: 'Breitengrad', max: 90 },
  longitude: { label: 'Längengrad', max: 180 },
} as const

const NUMBER_RE = /^-?\d+(?:[.,]\d+)?$/

export type CoordinateParseResult = { value: number | null } | { error: string }

/** Parse one typed coordinate. Empty → `null`; "52,271234" is read as 52.271234. */
export function parseCoordinate(raw: string, axis: CoordinateAxis): CoordinateParseResult {
  const text = raw.trim()
  if (text === '') return { value: null }

  const { label, max } = AXIS[axis]
  if (!NUMBER_RE.test(text)) return { error: `${label} ist keine gültige Zahl` }

  const value = Number(text.replace(',', '.'))
  if (Math.abs(value) > max) return { error: `${label} muss zwischen -${max} und ${max} liegen` }
  return { value }
}

// Both parts must carry decimals, so a single "52,271234" is never split in two.
const PAIR_RE = /^\s*(-?\d+[.,]\d+)\s*(?:[,;]\s*|\s+)(-?\d+[.,]\d+)\s*$/

/** Split a pasted "lat, lng" pair (Google Maps "Koordinaten kopieren"); `null` if it isn't one. */
export function splitCoordinatePair(text: string): { latitude: string; longitude: string } | null {
  const match = PAIR_RE.exec(text)
  return match ? { latitude: match[1], longitude: match[2] } : null
}

function toCoordinate(input: unknown, axis: CoordinateAxis): CoordinateParseResult {
  if (input == null) return { value: null }
  if (typeof input === 'number') {
    return Number.isFinite(input)
      ? parseCoordinate(String(input), axis)
      : { error: `${AXIS[axis].label} ist keine gültige Zahl` }
  }
  if (typeof input === 'string') return parseCoordinate(input, axis)
  return { error: `${AXIS[axis].label} ist keine gültige Zahl` }
}

export type CoordinatePairResult =
  | { latitude: number | null; longitude: number | null }
  | { error: string }

/**
 * Validate a latitude/longitude pair from a request body. Both or neither —
 * a half-filled pair would leave a building without a usable position.
 */
export function validateCoordinatePair(
  latitude: unknown,
  longitude: unknown,
  { required = false }: { required?: boolean } = {}
): CoordinatePairResult {
  const lat = toCoordinate(latitude, 'latitude')
  if ('error' in lat) return lat
  const lng = toCoordinate(longitude, 'longitude')
  if ('error' in lng) return lng

  if (lat.value === null && lng.value === null) {
    return required
      ? { error: 'Breiten- und Längengrad sind erforderlich' }
      : { latitude: null, longitude: null }
  }
  if (lat.value === null || lng.value === null) {
    return { error: 'Bitte Breiten- und Längengrad angeben (oder beide leer lassen)' }
  }
  return { latitude: lat.value, longitude: lng.value }
}

/**
 * Rough box around Osnabrück. Only drives a non-blocking warning in the admin
 * forms — it catches swapped fields and stray values like -1 / 1.
 */
export function isNearOsnabrueck(latitude: number, longitude: number): boolean {
  return latitude >= 52.1 && latitude <= 52.4 && longitude >= 7.8 && longitude <= 8.3
}
