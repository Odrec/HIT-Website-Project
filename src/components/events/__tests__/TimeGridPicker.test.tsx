import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimeGridPicker } from '../TimeGridPicker'

describe('TimeGridPicker', () => {
  it('renders with label', () => {
    render(<TimeGridPicker value="" onChange={vi.fn()} label="Beginn" required />)
    expect(screen.getByText('Beginn')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('shows placeholder when no value', () => {
    render(<TimeGridPicker value="" onChange={vi.fn()} label="Beginn" />)
    expect(screen.getByText('Uhrzeit wählen')).toBeInTheDocument()
  })
})
