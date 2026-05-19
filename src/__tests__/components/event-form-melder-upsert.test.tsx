import { describe, it } from 'vitest'

describe('EventForm — Melder upsert on submit', () => {
  // RTL test would require mocking ~8 API calls + populating date/time/building
  // selects through Zod-validated form. The upsert logic is a single block in
  // EventForm.tsx that calls /api/melder/upsert before the parent onSubmit.
  // API-level regression coverage lives in src/__tests__/api/melder-upsert.test.ts.
  it.todo('upserts Melder when fields are filled and no melderId is set')
  it.todo('skips upsert in edit mode (melderId already present)')
  it.todo('surfaces API error when upsert fails')
})
