import { describe, it, expect } from 'vitest'
import { buildingFormSchema, roomFormSchema } from '../building'

describe('buildingFormSchema', () => {
  it('accepts valid building data', () => {
    const result = buildingFormSchema.safeParse({
      name: 'Schloss',
      address: 'Neuer Graben 29',
      campus: 'Innenstadt',
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal data (name only)', () => {
    const result = buildingFormSchema.safeParse({ name: 'Caprivi' })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = buildingFormSchema.safeParse({ address: 'Some address' })
    expect(result.success).toBe(false)
  })
})

describe('roomFormSchema', () => {
  it('accepts valid room data', () => {
    const result = roomFormSchema.safeParse({ name: '101', floor: '1. OG' })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = roomFormSchema.safeParse({ floor: 'EG' })
    expect(result.success).toBe(false)
  })
})
