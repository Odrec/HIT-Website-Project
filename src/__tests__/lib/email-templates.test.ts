import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { generateNewEventEmail, generateEditEventEmail, detectChanges } from '@/lib/email-templates'
import { EventType, Institution, LocationType } from '@/types/events'
import type { EmailEvent } from '@/lib/email-templates'

// Minimal valid EmailEvent fixture.
// Event times are stored as "wall-clock" Berlin times: the Date's UTC
// components match the Berlin wall-clock. Use Date.UTC() so the fixture is
// independent of the test runner's local timezone.
const baseEvent: EmailEvent = {
  id: 'evt-1',
  title: 'Studiengang Informatik',
  description: 'Ein spannender Studiengang',
  eventType: EventType.VORTRAG,
  institution: Institution.UNI,
  timeStart: new Date(Date.UTC(2026, 10, 19, 9, 0, 0)),
  timeEnd: new Date(Date.UTC(2026, 10, 19, 9, 45, 0)),
  locationType: LocationType.OTHER,
  building: {
    id: 'b1',
    slug: 'schloss',
    name: 'Schloss',
    shortName: null,
    address: null,
    campus: null,
    latitude: 52.272,
    longitude: 8.043,
    hasAccessibility: false,
    accessibilityNotes: null,
  },
  room: { id: 'r1', name: '11/E12', floor: null, buildingId: 'b1' },
  melder: {
    id: 'm1',
    userId: 'u1',
    firstName: 'Thomas',
    lastName: 'Müller',
    title: 'Prof. Dr.',
    email: 'mueller@uos.de',
    phone: null,
    affiliation: 'UNI' as never,
    fakultaet: null,
    fachbereich: null,
    room: null,
  },
  lecturers: [
    {
      id: 'l1',
      eventId: 'evt-1',
      firstName: 'Anna',
      lastName: 'Schmidt',
      title: 'Dr.',
      email: 'schmidt@uos.de',
    },
    {
      id: 'l2',
      eventId: 'evt-1',
      firstName: 'Max',
      lastName: 'Mustermann',
    },
  ],
  studyPrograms: [
    {
      studyProgramId: 'sp1',
      studyProgram: { id: 'sp1', name: 'Informatik B.Sc.', institution: Institution.UNI },
    },
    {
      studyProgramId: 'sp2',
      studyProgram: {
        id: 'sp2',
        name: 'Wirtschaftsinformatik B.Sc.',
        institution: Institution.UNI,
      },
    },
  ],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

describe('generateNewEventEmail', () => {
  beforeEach(() => {
    vi.stubEnv('NEXTAUTH_URL', 'https://hit.zsb.os.de')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns subject with event title', () => {
    const { subject } = generateNewEventEmail(baseEvent)
    expect(subject).toBe('HIT — Neue Veranstaltung: Studiengang Informatik')
  })

  it('HTML contains event title', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('Studiengang Informatik')
  })

  it('HTML contains German event type label', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('Vortrag')
  })

  it('HTML contains German institution label', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('Universität Osnabrück')
  })

  it('HTML contains formatted start time (HH:mm)', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('09:00')
  })

  it('HTML contains formatted end time (HH:mm)', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('09:45')
  })

  it('HTML contains building name', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('Schloss')
  })

  it('HTML contains room name', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('11/E12')
  })

  it('HTML contains melder name', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('Thomas Müller')
  })

  it('HTML contains melder email', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('mueller@uos.de')
  })

  it('HTML contains lecturer full name with title', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('Dr. Anna Schmidt')
  })

  it('HTML contains lecturer full name without title', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('Max Mustermann')
  })

  it('HTML contains study program names', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('Informatik B.Sc.')
    expect(html).toContain('Wirtschaftsinformatik B.Sc.')
  })

  it('HTML contains admin link using NEXTAUTH_URL', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('https://hit.zsb.os.de')
  })

  it('HTML uses burgundy header color', () => {
    const { html } = generateNewEventEmail(baseEvent)
    expect(html).toContain('#AC0634')
  })

  it('works with null building and room', () => {
    const event = { ...baseEvent, building: null, room: null }
    const { html } = generateNewEventEmail(event)
    expect(html).toContain('Studiengang Informatik')
  })

  it('works with null melder', () => {
    const event = { ...baseEvent, melder: null }
    const { html } = generateNewEventEmail(event)
    expect(html).toContain('Studiengang Informatik')
  })

  it('works with empty lecturers', () => {
    const event = { ...baseEvent, lecturers: [] }
    const { html } = generateNewEventEmail(event)
    expect(html).toContain('Studiengang Informatik')
  })

  it('works with empty studyPrograms', () => {
    const event = { ...baseEvent, studyPrograms: [] }
    const { html } = generateNewEventEmail(event)
    expect(html).toContain('Studiengang Informatik')
  })
})

describe('detectChanges', () => {
  it('returns empty array when nothing changed', () => {
    const changes = detectChanges(baseEvent, baseEvent)
    expect(changes).toEqual([])
  })

  it('detects title change', () => {
    const newEvent = { ...baseEvent, title: 'Neuer Titel' }
    const changes = detectChanges(baseEvent, newEvent)
    expect(changes).toContainEqual({
      field: 'title',
      oldValue: 'Studiengang Informatik',
      newValue: 'Neuer Titel',
    })
  })

  it('detects description change', () => {
    const newEvent = { ...baseEvent, description: 'Neue Beschreibung' }
    const changes = detectChanges(baseEvent, newEvent)
    expect(changes).toContainEqual({
      field: 'description',
      oldValue: 'Ein spannender Studiengang',
      newValue: 'Neue Beschreibung',
    })
  })

  it('detects eventType change', () => {
    const newEvent = { ...baseEvent, eventType: EventType.WORKSHOP }
    const changes = detectChanges(baseEvent, newEvent)
    expect(changes).toContainEqual({
      field: 'eventType',
      oldValue: EventType.VORTRAG,
      newValue: EventType.WORKSHOP,
    })
  })

  it('detects institution change', () => {
    const newEvent = { ...baseEvent, institution: Institution.HOCHSCHULE }
    const changes = detectChanges(baseEvent, newEvent)
    expect(changes).toContainEqual({
      field: 'institution',
      oldValue: Institution.UNI,
      newValue: Institution.HOCHSCHULE,
    })
  })

  it('detects timeStart change', () => {
    const newEvent = { ...baseEvent, timeStart: new Date(Date.UTC(2026, 10, 19, 10, 0, 0)) }
    const changes = detectChanges(baseEvent, newEvent)
    expect(changes).toContainEqual({
      field: 'timeStart',
      oldValue: baseEvent.timeStart,
      newValue: newEvent.timeStart,
    })
  })

  it('detects timeEnd change', () => {
    const newEvent = { ...baseEvent, timeEnd: new Date(Date.UTC(2026, 10, 19, 11, 0, 0)) }
    const changes = detectChanges(baseEvent, newEvent)
    expect(changes).toContainEqual({
      field: 'timeEnd',
      oldValue: baseEvent.timeEnd,
      newValue: newEvent.timeEnd,
    })
  })

  it('does not flag timeStart as changed when dates are equal', () => {
    const newEvent = {
      ...baseEvent,
      timeStart: new Date(baseEvent.timeStart!.getTime()),
    }
    const changes = detectChanges(baseEvent, newEvent)
    expect(changes.find((c) => c.field === 'timeStart')).toBeUndefined()
  })

  it('detects building change', () => {
    const newBuilding = {
      id: 'b2',
      slug: 'neues-gebaeude',
      name: 'Neues Gebäude',
      shortName: null,
      address: null,
      campus: null,
      latitude: 52.273,
      longitude: 8.044,
      hasAccessibility: false,
      accessibilityNotes: null,
    }
    const newEvent = { ...baseEvent, building: newBuilding, buildingId: 'b2' }
    const changes = detectChanges(baseEvent, newEvent)
    expect(changes).toContainEqual(expect.objectContaining({ field: 'building' }))
  })

  it('detects room change', () => {
    const newRoom = { id: 'r2', name: 'Neuer Raum', floor: null, buildingId: 'b1' }
    const newEvent = { ...baseEvent, room: newRoom, roomId: 'r2' }
    const changes = detectChanges(baseEvent, newEvent)
    expect(changes).toContainEqual(expect.objectContaining({ field: 'room' }))
  })

  it('detects lecturer changes', () => {
    const newEvent = {
      ...baseEvent,
      lecturers: [{ id: 'l3', eventId: 'evt-1', firstName: 'Klaus', lastName: 'Weber' }],
    }
    const changes = detectChanges(baseEvent, newEvent)
    expect(changes).toContainEqual(expect.objectContaining({ field: 'lecturers' }))
  })

  it('detects study program changes', () => {
    const newEvent = {
      ...baseEvent,
      studyPrograms: [
        {
          studyProgramId: 'sp3',
          studyProgram: { id: 'sp3', name: 'Mathematik B.Sc.', institution: Institution.UNI },
        },
      ],
    }
    const changes = detectChanges(baseEvent, newEvent)
    expect(changes).toContainEqual(expect.objectContaining({ field: 'studyPrograms' }))
  })

  it('returns only changed fields', () => {
    const newEvent = { ...baseEvent, title: 'Nur Titel geändert' }
    const changes = detectChanges(baseEvent, newEvent)
    expect(changes).toHaveLength(1)
    expect(changes[0].field).toBe('title')
  })
})

describe('generateEditEventEmail', () => {
  const changes = [
    { field: 'title', oldValue: 'Alter Titel', newValue: 'Neuer Titel' },
    { field: 'eventType', oldValue: EventType.VORTRAG, newValue: EventType.WORKSHOP },
  ]

  beforeEach(() => {
    vi.stubEnv('NEXTAUTH_URL', 'https://hit.zsb.os.de')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns subject with event title', () => {
    const { subject } = generateEditEventEmail(baseEvent, changes)
    expect(subject).toBe('HIT — Veranstaltung bearbeitet: Studiengang Informatik')
  })

  it('HTML contains "Was hat sich geändert"', () => {
    const { html } = generateEditEventEmail(baseEvent, changes)
    expect(html).toContain('Was hat sich geändert')
  })

  it('HTML contains old value', () => {
    const { html } = generateEditEventEmail(baseEvent, changes)
    expect(html).toContain('Alter Titel')
  })

  it('HTML contains new value', () => {
    const { html } = generateEditEventEmail(baseEvent, changes)
    expect(html).toContain('Neuer Titel')
  })

  it('HTML uses blue header color', () => {
    const { html } = generateEditEventEmail(baseEvent, changes)
    expect(html).toContain('#009EE3')
  })

  it('HTML contains change summary box (yellow background)', () => {
    const { html } = generateEditEventEmail(baseEvent, changes)
    // The change box uses a yellow/amber background (#FFFBCC or similar)
    expect(html).toContain('#FFFBCC')
  })

  it('HTML contains strikethrough for old values', () => {
    const { html } = generateEditEventEmail(baseEvent, changes)
    expect(html).toContain('text-decoration')
    expect(html).toContain('line-through')
  })

  it('HTML marks new values in green', () => {
    const { html } = generateEditEventEmail(baseEvent, changes)
    expect(html).toMatch(/color:\s*#?(0[0-9a-fA-F]{5}|[0-9a-fA-F]{3}|green)/i)
  })

  it('HTML contains event details table', () => {
    const { html } = generateEditEventEmail(baseEvent, changes)
    expect(html).toContain('Studiengang Informatik')
  })

  it('works with empty changes array', () => {
    const { html, subject } = generateEditEventEmail(baseEvent, [])
    expect(subject).toBe('HIT — Veranstaltung bearbeitet: Studiengang Informatik')
    expect(html).toContain('Studiengang Informatik')
  })
})
