import { describe, it, expect } from 'vitest'
import { generateGoogleCalendarUrl } from '@/lib/calendar-utils'

describe('generateGoogleCalendarUrl', () => {
  it('generates correct Google Calendar URL with all fields', () => {
    const event = {
      title: 'Studiengangsvorstellung Informatik',
      description: 'Einführung in den Studiengang',
      timeStart: new Date('2026-11-19T09:00:00'),
      timeEnd: new Date('2026-11-19T09:45:00'),
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
    expect(url).toContain('location=Schloss%2C+11%2FE12')
  })

  it('handles missing location gracefully', () => {
    const event = {
      title: 'Online Vortrag',
      description: 'Ein Online-Event',
      timeStart: new Date('2026-11-19T10:00:00'),
      timeEnd: new Date('2026-11-19T10:30:00'),
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
      timeStart: new Date('2026-11-19T11:00:00'),
      timeEnd: new Date('2026-11-19T11:45:00'),
      location: null,
    }

    const url = generateGoogleCalendarUrl(event)

    expect(url).toContain('text=Workshop')
    expect(url).not.toContain('details=')
  })
})
