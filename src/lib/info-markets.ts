// Infomärkte — display order shared by the public /events/infomaerkte page and
// the PDF booklet.

import { compareDe } from '@/lib/sort-de'

// Display order for the three known markets. Anything not in this list is
// appended after, alphabetically. Match is case-insensitive substring on
// the market name to tolerate small wording changes ("Infomarkt Schloss"
// vs "Schloss Infomarkt").
const MARKET_ORDER = ['schloss', 'sl', 'caprivi'] as const

function marketSortKey(name: string): number {
  const lower = name.toLowerCase()
  const idx = MARKET_ORDER.findIndex((token) => lower.includes(token))
  return idx === -1 ? MARKET_ORDER.length : idx
}

export function compareInfoMarkets(a: { name: string }, b: { name: string }): number {
  return marketSortKey(a.name) - marketSortKey(b.name) || compareDe(a.name, b.name)
}
