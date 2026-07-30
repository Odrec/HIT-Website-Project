/**
 * Registry of admin-editable text slots.
 *
 * Defaults ship with the build, so the site renders correctly against an empty
 * content_texts table and a slot can never be blank. Adding a slot here plus
 * reading it in the page is all that is needed — the admin editor is generated
 * from this list.
 */
export interface ContentSlot {
  key: string
  label: string
  group: string
  default: string
  multiline?: boolean
}

export const CONTENT_SLOTS = [
  // --- Hero ---------------------------------------------------------------
  {
    key: 'home.hero.title',
    label: 'Überschrift',
    group: 'Startseite – Hero',
    default: 'Hochschulinfotag 2026',
  },
  {
    key: 'home.hero.subtitle',
    label: 'Einleitungstext',
    group: 'Startseite – Hero',
    default:
      'Entdecken Sie die Universität und Hochschule Osnabrück! Besuchen Sie Vorträge, Laborführungen und Workshops zu über 200 Studiengängen.',
    multiline: true,
  },

  // --- Zahlen -------------------------------------------------------------
  {
    key: 'home.stats.events.label',
    label: 'Kachel 1 – Bezeichnung (Wert wird berechnet)',
    group: 'Startseite – Zahlen',
    default: 'Veranstaltungen',
  },
  {
    key: 'home.stats.programs.value',
    label: 'Kachel 2 – Wert',
    group: 'Startseite – Zahlen',
    default: '200+',
  },
  {
    key: 'home.stats.programs.label',
    label: 'Kachel 2 – Bezeichnung',
    group: 'Startseite – Zahlen',
    default: 'Studiengänge',
  },
  {
    key: 'home.stats.institutions.value',
    label: 'Kachel 3 – Wert',
    group: 'Startseite – Zahlen',
    default: '2',
  },
  {
    key: 'home.stats.institutions.label',
    label: 'Kachel 3 – Bezeichnung',
    group: 'Startseite – Zahlen',
    default: 'Hochschulen',
  },
  {
    key: 'home.stats.days.value',
    label: 'Kachel 4 – Wert',
    group: 'Startseite – Zahlen',
    default: '1',
  },
  {
    key: 'home.stats.days.label',
    label: 'Kachel 4 – Bezeichnung',
    group: 'Startseite – Zahlen',
    default: 'Tag',
  },

  // --- Hochschulen --------------------------------------------------------
  {
    key: 'home.institutions.heading',
    label: 'Abschnittsüberschrift',
    group: 'Startseite – Hochschulen',
    default: 'Zwei Hochschulen – ein Infotag',
  },
  {
    key: 'home.uni.subtitle',
    label: 'Universität – Untertitel',
    group: 'Startseite – Hochschulen',
    default: 'Forschung und Lehre seit 1974',
  },
  {
    key: 'home.uni.bullet.programs',
    label: 'Universität – Punkt 1',
    group: 'Startseite – Hochschulen',
    default: '100+ Studiengänge',
  },
  {
    key: 'home.uni.bullet.students',
    label: 'Universität – Punkt 2',
    group: 'Startseite – Hochschulen',
    default: '13.000+ Studierende',
  },
  {
    key: 'home.uni.bullet.extra',
    label: 'Universität – Punkt 3',
    group: 'Startseite – Hochschulen',
    default: 'Exzellente Forschung',
  },
  {
    key: 'home.hs.subtitle',
    label: 'Hochschule – Untertitel',
    group: 'Startseite – Hochschulen',
    default: 'Praxisnah studieren seit 1971',
  },
  {
    key: 'home.hs.bullet.programs',
    label: 'Hochschule – Punkt 1',
    group: 'Startseite – Hochschulen',
    default: '100+ Studiengänge',
  },
  {
    key: 'home.hs.bullet.students',
    label: 'Hochschule – Punkt 2',
    group: 'Startseite – Hochschulen',
    default: '13.000+ Studierende',
  },
  {
    key: 'home.hs.bullet.extra',
    label: 'Hochschule – Punkt 3',
    group: 'Startseite – Hochschulen',
    default: 'Praxisnahe Ausbildung',
  },
] as const satisfies readonly ContentSlot[]

export type ContentSlotKey = (typeof CONTENT_SLOTS)[number]['key']

export const CONTENT_DEFAULTS: Record<string, string> = Object.fromEntries(
  CONTENT_SLOTS.map((s) => [s.key, s.default])
)
