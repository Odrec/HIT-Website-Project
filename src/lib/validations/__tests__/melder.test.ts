import { describe, it, expect } from 'vitest'
import { melderFormSchema } from '../melder'

describe('melderFormSchema', () => {
  it('accepts valid melder data', () => {
    const result = melderFormSchema.safeParse({
      name: 'Dr. Schmidt',
      email: 'schmidt@uni-osnabrueck.de',
      affiliation: 'UNI',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = melderFormSchema.safeParse({
      email: 'test@test.de',
      affiliation: 'UNI',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid affiliation', () => {
    const result = melderFormSchema.safeParse({
      name: 'Test',
      email: 'test@test.de',
      affiliation: 'INVALID',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = melderFormSchema.safeParse({
      name: 'Test',
      email: 'not-an-email',
      affiliation: 'EXTERN',
    })
    expect(result.success).toBe(false)
  })
})
