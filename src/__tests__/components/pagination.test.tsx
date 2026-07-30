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
