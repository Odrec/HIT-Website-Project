import { describe, it, expect } from 'vitest'
import { generateGoogleCalendarUrl } from '@/lib/calendar-utils'

describe('generateGoogleCalendarUrl', () => {
  // Event times are stored as "wall-clock" Berlin times: the Date's UTC
  // components match the Berlin wall-clock. Tests must use Date.UTC() to
  // avoid depending on the test runner's local timezone.
  it('generates correct Google Calendar URL with all fields', () => {
    const event = {
      title: 'Studiengangsvorstellung Informatik',
      description: 'Einführung in den Studiengang',
      timeStart: new Date(Date.UTC(2026, 10, 19, 9, 0, 0)),
      timeEnd: new Date(Date.UTC(2026, 10, 19, 9, 45, 0)),
      building: {
        name: 'Schloss',
      },
      room: {
        name: '11/E12',
      },
    }

    const url = generateGoogleCalendarUrl(event)

    expect(url).toContain('https://calendar.google.com/calendar/render')
    expect(url).toContain('action=TEMPLATE')
    expect(url).toContain('text=Studiengangsvorstellung+Informatik')
    expect(url).toContain('dates=20261119T090000/20261119T094500')
    expect(url).toContain('ctz=Europe%2FBerlin')
    expect(url).toContain('location=Schloss%2C+11%2FE12')
  })

  it('handles missing location gracefully', () => {
    const event = {
      title: 'Online Vortrag',
      description: 'Ein Online-Event',
      timeStart: new Date(Date.UTC(2026, 10, 19, 10, 0, 0)),
      timeEnd: new Date(Date.UTC(2026, 10, 19, 10, 30, 0)),
      location: null,
    }

    const url = generateGoogleCalendarUrl(event)

    expect(url).toContain('text=Online+Vortrag')
    expect(url).not.toContain('location=')
  })

  it('handles missing description', () => {
    const event = {
      title: 'Workshop',
      description: null,
      timeStart: new Date(Date.UTC(2026, 10, 19, 11, 0, 0)),
      timeEnd: new Date(Date.UTC(2026, 10, 19, 11, 45, 0)),
      location: null,
    }

    const url = generateGoogleCalendarUrl(event)

    expect(url).toContain('text=Workshop')
    expect(url).not.toContain('details=')
  })
})
