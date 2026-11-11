// Links that show a building on a map.
//
// Google Maps must only ever get coordinates. Building names are room-plan
// labels ("11" = Schloss, "FC" = Plektrum), and when they were passed along as
// "11, Neuer Graben 29, 49074 Osnabrück" Google read "11" as part of the
// address and dropped the pin near the Neumarkt instead of at the Schloss
// (November 2026 feedback). The admin-curated coordinates are the one reliable
// position we have.

import type { Coordinates } from '@/types/routes'

/** Query parameter of /route-planner that pre-selects a building by slug. */
export const LAGEPLAN_BUILDING_PARAM = 'building'

/** Internal Lageplan, centred on the building with this slug. */
export function lageplanHref(buildingSlug: string): string {
  return `/route-planner?${LAGEPLAN_BUILDING_PARAM}=${encodeURIComponent(buildingSlug)}`
}

/** Google Maps pin at the given coordinates (opens the maps app on phones). */
export function googleMapsLocationUrl({ latitude, longitude }: Coordinates): string {
  const params = new URLSearchParams({ api: '1', query: `${latitude},${longitude}` })
  return `https://www.google.com/maps/search/?${params.toString()}`
}
