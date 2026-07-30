import { describe, it, expect, vi } from 'vitest'

// getContentTexts is wrapped in React's per-request cache(), so this test lives
// in its own file: Vitest isolates module state per test file, which keeps this
// single call to getContentTexts() from ever sharing a memoised result with the
// success-path tests in content-texts.test.ts.
const mockFindMany = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    contentText: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}))

import { getContentTexts } from '@/lib/content-texts'
import { CONTENT_DEFAULTS } from '@/lib/content-slots'

describe('getContentTexts', () => {
  it('falls back to defaults when the content table read fails, so a DB problem never takes the homepage down', async () => {
    mockFindMany.mockRejectedValue(new Error('connection refused'))
    // Silence the expected console.error from the catch block for this test.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await getContentTexts()

    expect(result).toEqual(CONTENT_DEFAULTS)
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})
