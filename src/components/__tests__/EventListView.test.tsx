import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventListView } from '../events/EventListView'

// AddToScheduleButton requires ScheduleProvider context — mock it away for unit tests
vi.mock('@/components/schedule/AddToScheduleButton', () => ({
  AddToScheduleButton: () => null,
}))

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockReset()
})

const sampleEvent = {
  id: 'e1',
  title: 'Workshop Robotik',
  description: 'Hands-on session',
  eventType: 'WORKSHOP',
  timeStart: '2026-11-19T10:00:00',
  timeEnd: '2026-11-19T11:00:00',
  locationType: 'OTHER',
  locationDetails: null,
  roomRequest: null,
  meetingPoint: null,
  additionalInfo: null,
  photoUrl: null,
  institution: 'UNI',
  location: { id: 'b1', buildingName: '02', roomNumber: '101', address: null },
  lecturers: [],
  studyPrograms: [],
}

describe('EventListView', () => {
  it('passes static filters into the API request', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ events: [sampleEvent], total: 1 }),
    } as Response)

    render(<EventListView staticFilters={{ clusterId: 'abc' }} />)

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const url = (mockFetch.mock.calls[0][0] as string)
    expect(url).toContain('clusterId=abc')
  })

  it('renders the event title returned by the API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ events: [sampleEvent], total: 1 }),
    } as Response)

    render(<EventListView />)
    expect(await screen.findByText('Workshop Robotik')).toBeInTheDocument()
  })

  it('shows empty state when API returns no events', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ events: [], total: 0 }),
    } as Response)

    render(<EventListView />)
    expect(await screen.findByText(/Keine Veranstaltungen gefunden/)).toBeInTheDocument()
  })
})
