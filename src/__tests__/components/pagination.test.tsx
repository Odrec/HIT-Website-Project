import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination, pageWindow } from '@/components/ui/pagination'

describe('pageWindow', () => {
  it('lists every page when they fit', () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('always keeps first and last page', () => {
    const w = pageWindow(10, 20)
    expect(w[0]).toBe(1)
    expect(w[w.length - 1]).toBe(20)
  })

  it('inserts gaps around a middle page', () => {
    expect(pageWindow(10, 20)).toContain('gap')
  })

  it('includes the current page and its neighbours', () => {
    const w = pageWindow(10, 20)
    expect(w).toContain(9)
    expect(w).toContain(10)
    expect(w).toContain(11)
  })

  // Invariant tests to catch budget and elision bugs
  it('never exceeds maxSlots across diverse inputs', () => {
    const inputs = [
      [10, 20],
      [50, 100],
      [4, 8],
      [5, 8],
      [1, 8],
      [8, 8],
    ]
    inputs.forEach(([page, total]) => {
      const result = pageWindow(page, total)
      expect(result.length).toBeLessThanOrEqual(7)
    })
  })

  it('never emits a gap that hides exactly one page', () => {
    const inputs = [
      [10, 20],
      [50, 100],
      [4, 8],
      [5, 8],
      [1, 8],
    ]
    inputs.forEach(([page, total]) => {
      const result = pageWindow(page, total)
      for (let i = 0; i < result.length; i++) {
        if (result[i] === 'gap') {
          const beforeVal = result[i - 1]
          const afterVal = result[i + 1]
          const before = typeof beforeVal === 'number' ? beforeVal : 0
          const after = typeof afterVal === 'number' ? afterVal : 0
          // Gap should never hide exactly one page
          expect(after - before).toBeGreaterThan(2)
        }
      }
    })
  })

  it('contains no duplicate page numbers', () => {
    const inputs = [
      [10, 20],
      [50, 100],
      [4, 8],
      [5, 8],
    ]
    inputs.forEach(([page, total]) => {
      const result = pageWindow(page, total)
      const numbers = result.filter((x) => typeof x === 'number')
      const unique = new Set(numbers)
      expect(unique.size).toBe(numbers.length)
    })
  })

  it('always includes page 1 and the last page', () => {
    const inputs = [
      [10, 20],
      [50, 100],
      [4, 8],
      [5, 8],
      [1, 8],
    ]
    inputs.forEach(([page, total]) => {
      const result = pageWindow(page, total)
      expect(result).toContain(1)
      expect(result).toContain(total)
    })
  })
})

describe('Pagination', () => {
  it('shows the page and item summary', () => {
    render(<Pagination page={1} totalPages={3} totalItems={34} onPageChange={() => {}} />)
    expect(screen.getByText(/Seite 1 von 3/)).toBeInTheDocument()
    expect(screen.getByText(/34 Veranstaltungen/)).toBeInTheDocument()
  })

  it('uses a custom item label', () => {
    render(
      <Pagination
        page={1}
        totalPages={2}
        totalItems={7}
        itemLabel="Studiengänge"
        onPageChange={() => {}}
      />
    )
    expect(screen.getByText(/7 Studiengänge/)).toBeInTheDocument()
  })

  it('reports the clicked page', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={1} totalPages={3} totalItems={30} onPageChange={onPageChange} />)
    await userEvent.click(screen.getByRole('button', { name: '2' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('disables previous on the first page and next on the last', () => {
    const { rerender } = render(
      <Pagination page={1} totalPages={3} totalItems={30} onPageChange={() => {}} />
    )
    expect(screen.getByRole('button', { name: 'Vorherige Seite' })).toBeDisabled()

    rerender(<Pagination page={3} totalPages={3} totalItems={30} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Nächste Seite' })).toBeDisabled()
  })

  it('marks the current page for assistive tech', () => {
    render(<Pagination page={2} totalPages={3} totalItems={30} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
  })
})
