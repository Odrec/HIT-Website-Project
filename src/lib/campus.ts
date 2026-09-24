// Campus areas of the two Osnabrück Hochschulen as used by the Lageplan and
// the route planner. The DB stores free-text campus names ("Innenstadt",
// "Schloss", "Westerberg", "Caprivi"); everything visitor-facing works on the
// normalised keys below, so normalise once at the API boundary.

export type CampusKey = 'schloss' | 'westerberg' | 'caprivi' | 'other'

export const CAMPUS_KEYS: CampusKey[] = ['schloss', 'westerberg', 'caprivi', 'other']

export const CAMPUS_LABELS: Record<CampusKey, string> = {
  schloss: 'Schloss / Innenstadt (Universität)',
  westerberg: 'Westerberg (Universität und Hochschule)',
  caprivi: 'Caprivi (Hochschule)',
  other: 'Sonstige Standorte',
}

export function normalizeCampus(raw: string | null | undefined): CampusKey {
  const v = (raw ?? '').trim().toLowerCase()
  if (!v) return 'other'
  if (v.startsWith('schloss') || v.startsWith('innenstadt')) return 'schloss'
  if (v.startsWith('westerberg')) return 'westerberg'
  if (v.startsWith('caprivi')) return 'caprivi'
  return 'other'
}

// Corporate colours: Uni = burgundy, Hochschule = cyan blue. Westerberg hosts
// both institutions but is predominantly Uni on the map.
export function getCampusColor(campus: CampusKey | string | null | undefined): string {
  switch (normalizeCampus(campus)) {
    case 'schloss':
    case 'westerberg':
      return '#AC0634'
    case 'caprivi':
      return '#009EE3'
    default:
      return '#6B7280'
  }
}
