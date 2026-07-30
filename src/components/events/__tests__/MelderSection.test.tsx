import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MelderSection, defaultMelderData } from '../MelderSection'

// The actual MelderPicker renders inside a Radix Popover, which is unrelated
// to what this test verifies (the race between the own-profile auto-fill
// fetch and a user pick). Replace it with plain buttons that call the same
// callbacks MelderSection passes down.
vi.mock('@/components/events/MelderPicker', () => ({
  MelderPicker: ({
    onSelect,
    onReset,
  }: {
    onSelect: (melder: Record<string, unknown>) => void
    onReset: () => void
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onSelect({
            id: 'picked-id',
            firstName: 'Picked',
            lastName: 'Person',
            title: null,
            email: 'picked@example.com',
            phone: null,
            affiliation: 'UNI',
            organisationseinheit: null,
            room: null,
            adresse: null,
          })
        }
      >
        pick
      </button>
      <button type="button" onClick={onReset}>
        reset
      </button>
    </div>
  ),
}))

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockReset()
})

describe('MelderSection — own-profile fetch race (regression test for review Finding 2)', () => {
  it('does not let a slow own-profile auto-fill overwrite a Melder picked while it was in flight', async () => {
    let resolveOwnProfile: () => void = () => {}
    const ownProfilePromise = new Promise<void>((resolve) => {
      resolveOwnProfile = resolve
    })
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/melder') {
        return ownProfilePromise.then(() => ({
          json: async () => ({
            id: 'own-id',
            firstName: 'Own',
            lastName: 'Profile',
            email: 'own@example.com',
          }),
        }))
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    const onChange = vi.fn()
    const onMelderIdChange = vi.fn()

    render(
      <MelderSection
        value={defaultMelderData}
        onChange={onChange}
        melderId={null}
        onMelderIdChange={onMelderIdChange}
        canPickExisting
        readOnly={false}
      />
    )

    // The own-profile fetch is now in flight (mockFetch was called, but its
    // promise chain is still pending — resolveOwnProfile has not run yet).
    expect(mockFetch).toHaveBeenCalledWith('/api/melder', expect.anything())

    fireEvent.click(screen.getByText('pick'))

    expect(onMelderIdChange).toHaveBeenCalledWith('picked-id')
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ firstName: 'Picked', lastName: 'Person' })
    )

    // Now let the slow own-profile fetch resolve, after the pick.
    await act(async () => {
      resolveOwnProfile()
      await new Promise((r) => setTimeout(r, 0))
    })

    // The stale response must not have overwritten the pick.
    expect(onMelderIdChange).not.toHaveBeenCalledWith('own-id')
    expect(onChange).not.toHaveBeenLastCalledWith(expect.objectContaining({ firstName: 'Own' }))
  })

  it('does not let a slow own-profile auto-fill overwrite a reset that happened while it was in flight', async () => {
    let resolveOwnProfile: () => void = () => {}
    const ownProfilePromise = new Promise<void>((resolve) => {
      resolveOwnProfile = resolve
    })
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/melder') {
        return ownProfilePromise.then(() => ({
          json: async () => ({
            id: 'own-id',
            firstName: 'Own',
            lastName: 'Profile',
            email: 'own@example.com',
          }),
        }))
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    const onChange = vi.fn()
    const onMelderIdChange = vi.fn()

    render(
      <MelderSection
        value={defaultMelderData}
        onChange={onChange}
        melderId={null}
        onMelderIdChange={onMelderIdChange}
        canPickExisting
        readOnly={false}
      />
    )

    fireEvent.click(screen.getByText('reset'))

    expect(onMelderIdChange).toHaveBeenCalledWith('')
    expect(onChange).toHaveBeenLastCalledWith(defaultMelderData)

    await act(async () => {
      resolveOwnProfile()
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(onMelderIdChange).not.toHaveBeenCalledWith('own-id')
    expect(onChange).not.toHaveBeenLastCalledWith(expect.objectContaining({ firstName: 'Own' }))
  })
})
