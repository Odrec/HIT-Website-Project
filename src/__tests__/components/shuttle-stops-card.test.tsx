import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShuttleStopsCard } from '@/components/admin/ShuttleStopsCard'

const stop = {
  id: 'osnabrueckhalle',
  name: 'OsnabrückHalle / Schloss',
  coordinates: { latitude: 52.2713, longitude: 8.042 },
  directionsNote: 'Eine Haltestelle (Seite der OsnabrückHalle)',
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('alert', vi.fn())
  fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
    if (!init?.method) return new Response(JSON.stringify([stop]))
    return new Response(JSON.stringify(stop))
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('ShuttleStopsCard', () => {
  it('lists the stops with their stored coordinates', async () => {
    render(<ShuttleStopsCard />)
    expect(await screen.findByText('OsnabrückHalle / Schloss')).toBeInTheDocument()
    expect(screen.getByText('52.2713, 8.042')).toBeInTheDocument()
  })

  it('saves six-decimal coordinates for an existing stop', async () => {
    render(<ShuttleStopsCard />)
    fireEvent.click(await screen.findByRole('button', { name: /bearbeiten/i }))

    fireEvent.change(screen.getByLabelText('Breitengrad'), { target: { value: '52,272345' } })
    fireEvent.change(screen.getByLabelText('Längengrad'), { target: { value: '8.044123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/shuttle-stops/osnabrueckhalle',
        expect.objectContaining({ method: 'PUT' })
      )
    )
    const putCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')!
    expect(JSON.parse(putCall[1].body)).toEqual({
      name: 'OsnabrückHalle / Schloss',
      latitude: 52.272345,
      longitude: 8.044123,
      directionsNote: 'Eine Haltestelle (Seite der OsnabrückHalle)',
    })
  })

  it('shows the server message when saving fails', async () => {
    render(<ShuttleStopsCard />)
    fireEvent.click(await screen.findByRole('button', { name: /bearbeiten/i }))
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Name ist erforderlich' }), { status: 400 })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Name ist erforderlich'))
  })
})
