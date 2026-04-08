import { render, screen } from '@testing-library/react'
import { HelpLink } from './HelpLink'

describe('HelpLink', () => {
  it('renders a link to the help section with label', () => {
    render(<HelpLink href="/hilfe/besucher#stundenplan" />)
    const link = screen.getByRole('link', { name: /hilfe/i })
    expect(link).toHaveAttribute('href', '/hilfe/besucher#stundenplan')
    expect(screen.getByText('Hilfe')).toBeInTheDocument()
  })
})
