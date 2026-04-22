import { describe, it, expect } from 'vitest'
import { melderFormSchema } from '../melder'

describe('melderFormSchema', () => {
  it('accepts valid melder data', () => {
    const result = melderFormSchema.safeParse({
      firstName: 'Hans',
      lastName: 'Schmidt',
      email: 'schmidt@uni-osnabrueck.de',
      affiliation: 'UNI',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing firstName', () => {
    const result = melderFormSchema.safeParse({
      lastName: 'Schmidt',
      email: 'test@test.de',
      affiliation: 'UNI',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing lastName', () => {
    const result = melderFormSchema.safeParse({
      firstName: 'Hans',
      email: 'test@test.de',
      affiliation: 'UNI',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid affiliation', () => {
    const result = melderFormSchema.safeParse({
      firstName: 'Hans',
      lastName: 'Schmidt',
      email: 'test@test.de',
      affiliation: 'INVALID',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = melderFormSchema.safeParse({
      firstName: 'Hans',
      lastName: 'Schmidt',
      email: 'not-an-email',
      affiliation: 'EXTERN',
    })
    expect(result.success).toBe(false)
  })
})
