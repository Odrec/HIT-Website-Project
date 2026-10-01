import { describe, it, expect } from 'vitest'
import { parseShuttleStopInput } from '@/lib/validations/shuttle-stop'

describe('parseShuttleStopInput', () => {
  it('accepts a stop with six-decimal coordinates', () => {
    expect(
      parseShuttleStopInput({
        name: '  Neuer Graben  ',
        latitude: 52.272345,
        longitude: '8,044123',
        directionsNote: ' Gegenüber vom Schloss ',
      })
    ).toEqual({
      data: {
        name: 'Neuer Graben',
        latitude: 52.272345,
        longitude: 8.044123,
        directionsNote: 'Gegenüber vom Schloss',
      },
    })
  })

  it('stores an empty note as null', () => {
    const result = parseShuttleStopInput({ name: 'A', latitude: 52.27, longitude: 8.04 })
    expect(result).toEqual({
      data: { name: 'A', latitude: 52.27, longitude: 8.04, directionsNote: null },
    })
  })

  it('requires a name', () => {
    expect(parseShuttleStopInput({ name: ' ', latitude: 52.27, longitude: 8.04 })).toEqual({
      error: 'Name ist erforderlich',
    })
  })

  it('requires a position — a stop without coordinates cannot be drawn', () => {
    expect(parseShuttleStopInput({ name: 'A', latitude: null, longitude: null })).toEqual({
      error: 'Breiten- und Längengrad sind erforderlich',
    })
  })

  it('rejects a body that is not an object', () => {
    expect(parseShuttleStopInput(null)).toEqual({ error: 'Ungültige Anfrage' })
  })
})
