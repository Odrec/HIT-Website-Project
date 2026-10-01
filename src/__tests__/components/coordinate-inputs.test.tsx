import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CoordinateInputs } from '@/components/admin/CoordinateInputs'

function Harness({ initial = { latitude: '', longitude: '' } }) {
  const [value, setValue] = useState(initial)
  return <CoordinateInputs idPrefix="t" value={value} onChange={setValue} />
}

describe('CoordinateInputs', () => {
  it('uses text inputs so arrow keys and the spinner cannot turn an empty field into -1 / 1', () => {
    render(<Harness />)
    expect(screen.getByLabelText('Breitengrad')).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Längengrad')).toHaveAttribute('type', 'text')
  })

  it('marks the placeholder as an example rather than a stored value', () => {
    render(<Harness />)
    expect(screen.getByLabelText('Breitengrad').getAttribute('placeholder')).toMatch(/^z\.B\. /)
    expect(screen.getByLabelText('Längengrad').getAttribute('placeholder')).toMatch(/^z\.B\. /)
  })

  it('distributes a pasted "lat, lng" pair over both fields', () => {
    render(<Harness />)
    fireEvent.paste(screen.getByLabelText('Breitengrad'), {
      clipboardData: { getData: () => '52.271234, 8.045678' },
    })
    expect(screen.getByLabelText('Breitengrad')).toHaveValue('52.271234')
    expect(screen.getByLabelText('Längengrad')).toHaveValue('8.045678')
  })

  it('leaves a normal single-number paste to the browser', () => {
    const onChange = vi.fn()
    render(
      <CoordinateInputs idPrefix="t" value={{ latitude: '', longitude: '' }} onChange={onChange} />
    )
    fireEvent.paste(screen.getByLabelText('Breitengrad'), {
      clipboardData: { getData: () => '52,271234' },
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows why an entry is invalid', () => {
    render(<Harness initial={{ latitude: '52.27x', longitude: '8.04' }} />)
    expect(screen.getByText('Breitengrad ist keine gültige Zahl')).toBeInTheDocument()
  })

  it('warns when the point is not in Osnabrück', () => {
    render(<Harness initial={{ latitude: '-1', longitude: '1' }} />)
    expect(screen.getByText(/liegen nicht in Osnabrück/)).toBeInTheDocument()
  })

  it('stays quiet for a valid campus position', () => {
    render(<Harness initial={{ latitude: '52.271234', longitude: '8.045678' }} />)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText(/liegen nicht in Osnabrück/)).toBeNull()
  })
})
