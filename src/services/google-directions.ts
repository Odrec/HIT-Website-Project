/**
 * Google Directions API client and polyline utilities.
 * Server-side only — API key never exposed to client.
 */

export interface DirectionsResult {
  distanceMeters: number
  durationSeconds: number
  polyline: string
  waypoints: [number, number][]
}

/**
 * Decode a Google encoded polyline string into [lat, lng] pairs.
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte: number

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0
    result = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    lng += result & 1 ? ~(result >> 1) : result >> 1

    points.push([lat / 1e5, lng / 1e5])
  }

  return points
}

/**
 * Fetch walking directions from Google Directions API.
 * Returns distance, duration, encoded polyline, and decoded waypoints.
 */
export async function fetchWalkingDirections(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<DirectionsResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY environment variable is not set')
  }

  const origin = `${fromLat},${fromLng}`
  const destination = `${toLat},${toLng}`
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=walking&key=${apiKey}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Google Directions API error: ${response.status}`)
  }

  const data = await response.json()

  if (data.status !== 'OK' || !data.routes?.length) {
    throw new Error(`Google Directions API returned status: ${data.status}`)
  }

  const route = data.routes[0]
  const leg = route.legs[0]
  const polyline = route.overview_polyline.points

  return {
    distanceMeters: leg.distance.value,
    durationSeconds: leg.duration.value,
    polyline,
    waypoints: decodePolyline(polyline),
  }
}
