import { describe, it, expect } from 'vitest'
import {
  parseCoordinate,
  splitCoordinatePair,
  validateCoordinatePair,
  isNearOsnabrueck,
} from '@/lib/coordinates'

describe('parseCoordinate', () => {
  it('treats an empty field as "no coordinate"', () => {
    expect(parseCoordinate('', 'latitude')).toEqual({ value: null })
    expect(parseCoordinate('   ', 'longitude')).toEqual({ value: null })
  })

  it('keeps all six decimals', () => {
    expect(parseCoordinate('52.271234', 'latitude')).toEqual({ value: 52.271234 })
  })

  it('accepts the German decimal comma', () => {
    expect(parseCoordinate('8,045678', 'longitude')).toEqual({ value: 8.045678 })
  })

  it('rejects text that is not a number instead of silently dropping it', () => {
    expect(parseCoordinate('52.27abc', 'latitude')).toEqual({
      error: 'Breitengrad ist keine gültige Zahl',
    })
  })

  it('rejects values outside the valid range', () => {
    expect(parseCoordinate('91', 'latitude')).toEqual({
      error: 'Breitengrad muss zwischen -90 und 90 liegen',
    })
    expect(parseCoordinate('181', 'longitude')).toEqual({
      error: 'Längengrad muss zwischen -180 und 180 liegen',
    })
  })
})

describe('splitCoordinatePair', () => {
  it('splits a Google-Maps style "lat, lng" pair', () => {
    expect(splitCoordinatePair('52.271234, 8.045678')).toEqual({
      latitude: '52.271234',
      longitude: '8.045678',
    })
  })

  it('splits pairs written with decimal commas or a semicolon', () => {
    expect(splitCoordinatePair('52,271234, 8,045678')).toEqual({
      latitude: '52,271234',
      longitude: '8,045678',
    })
    expect(splitCoordinatePair('52.271234;8.045678')).toEqual({
      latitude: '52.271234',
      longitude: '8.045678',
    })
  })

  it('does not split a single number written with a decimal comma', () => {
    expect(splitCoordinatePair('52,271234')).toBeNull()
    expect(splitCoordinatePair('52,27')).toBeNull()
  })

  it('ignores text that is not a coordinate pair', () => {
    expect(splitCoordinatePair('Schloßwall 1')).toBeNull()
  })
})

describe('validateCoordinatePair', () => {
  it('accepts numbers and numeric strings', () => {
    expect(validateCoordinatePair(52.271234, '8.045678')).toEqual({
      latitude: 52.271234,
      longitude: 8.045678,
    })
  })

  it('accepts "no coordinates" when both are empty', () => {
    expect(validateCoordinatePair(null, undefined)).toEqual({ latitude: null, longitude: null })
    expect(validateCoordinatePair('', '')).toEqual({ latitude: null, longitude: null })
  })

  it('rejects a half-filled pair', () => {
    expect(validateCoordinatePair(52.27, null)).toEqual({
      error: 'Bitte Breiten- und Längengrad angeben (oder beide leer lassen)',
    })
  })

  it('requires both when asked to', () => {
    expect(validateCoordinatePair(null, null, { required: true })).toEqual({
      error: 'Breiten- und Längengrad sind erforderlich',
    })
  })

  it('rejects garbage instead of storing NaN', () => {
    expect(validateCoordinatePair('abc', 8)).toEqual({
      error: 'Breitengrad ist keine gültige Zahl',
    })
    expect(validateCoordinatePair(52, true)).toEqual({
      error: 'Längengrad ist keine gültige Zahl',
    })
  })
})

describe('isNearOsnabrueck', () => {
  it('accepts a campus building', () => {
    expect(isNearOsnabrueck(52.271234, 8.045678)).toBe(true)
  })

  it('flags the -1 / 1 that the number spinner produced', () => {
    expect(isNearOsnabrueck(-1, 1)).toBe(false)
  })

  it('flags swapped latitude and longitude', () => {
    expect(isNearOsnabrueck(8.045678, 52.271234)).toBe(false)
  })
})
