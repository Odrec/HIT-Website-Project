import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EventPhoto } from '@/components/events/EventPhoto'
import { EventVideo } from '@/components/events/EventVideo'
import { VideoLinkInput } from '@/components/events/VideoLinkInput'
import { ImageUpload } from '@/components/events/ImageUpload'

describe('EventPhoto', () => {
  it('disappears instead of showing a broken image', () => {
    render(<EventPhoto src="/api/images/cmuimg123" alt="Foto" className="h-40" sizes="100vw" />)
    const img = screen.getByAltText('Foto')
    fireEvent.error(img)
    expect(screen.queryByAltText('Foto')).toBeNull()
  })
})

describe('EventVideo', () => {
  const url = 'https://www.youtube.com/watch?v=bsA6AfLREkI'

  it('loads nothing from YouTube until the visitor clicks', () => {
    const { container } = render(<EventVideo url={url} title="Imagefilm" />)
    expect(container.querySelector('iframe')).toBeNull()
    expect(screen.getByText(/Daten .* an YouTube übertragen/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Datenschutzerklärung' })).toHaveAttribute(
      'href',
      '/datenschutz'
    )
  })

  it('embeds the privacy-friendly player after the click', () => {
    const { container } = render(<EventVideo url={url} title="Imagefilm" />)
    fireEvent.click(screen.getByRole('button', { name: /Video abspielen/ }))
    const iframe = container.querySelector('iframe')!
    expect(iframe.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/bsA6AfLREkI?autoplay=1&rel=0'
    )
    expect(iframe).toHaveAttribute('title', 'Video: Imagefilm')
  })

  it('always offers the video on YouTube itself', () => {
    render(<EventVideo url={url} title="Imagefilm" />)
    expect(screen.getByRole('link', { name: /Auf YouTube ansehen/ })).toHaveAttribute('href', url)
  })

  it('renders nothing for a link it cannot play', () => {
    const { container } = render(<EventVideo url="https://example.org/x" title="X" />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('VideoLinkInput', () => {
  function Harness() {
    const [value, setValue] = useState('')
    return <VideoLinkInput value={value} onChange={setValue} />
  }

  it('confirms a recognised link', () => {
    render(<Harness />)
    fireEvent.change(screen.getByLabelText(/Video/), {
      target: { value: 'https://youtu.be/bsA6AfLREkI' },
    })
    expect(screen.getByText('YouTube-Video erkannt')).toBeInTheDocument()
  })

  it('explains what is wrong with any other link', () => {
    render(<Harness />)
    fireEvent.change(screen.getByLabelText(/Video/), {
      target: { value: 'https://www.hs-osnabrueck.de/musik/' },
    })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Bitte einen Link zu einem YouTube- oder Vimeo-Video angeben.'
    )
  })
})

describe('ImageUpload link check', () => {
  // jsdom never loads images, so simulate the browser deciding whether the
  // address is an image.
  let loads: boolean
  class FakeImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_value: string) {
      setTimeout(() => (loads ? this.onload?.() : this.onerror?.()), 0)
    }
  }

  beforeEach(() => {
    vi.stubGlobal('Image', FakeImage)
  })
  afterEach(() => vi.unstubAllGlobals())

  function enterUrl(url: string, onChange = vi.fn()) {
    render(<ImageUpload value="" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /URL eingeben/ }))
    fireEvent.change(screen.getByPlaceholderText('https://...'), { target: { value: url } })
    fireEvent.click(screen.getByRole('button', { name: 'OK' }))
    return onChange
  }

  it('takes an address that really is an image', async () => {
    loads = true
    const onChange = enterUrl('https://example.org/foto.jpg')
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('https://example.org/foto.jpg'))
  })

  it('refuses a web page and says how to get the image address', async () => {
    loads = false
    const onChange = enterUrl('https://www.hs-osnabrueck.de/veranstaltungen-ifm/')
    expect(await screen.findByText(/Unter dieser Adresse wurde kein Bild gefunden/)).toBeVisible()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('sends a video link to the video field', () => {
    const onChange = enterUrl('https://youtu.be/bsA6AfLREkI')
    expect(
      screen.getByText('Das ist ein Video-Link – bitte im Feld „Video“ eintragen.')
    ).toBeVisible()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('accepts an image dragged in from another web page as a link', async () => {
    loads = true
    const onChange = vi.fn()
    render(<ImageUpload value="" onChange={onChange} />)
    fireEvent.drop(screen.getByText(/Foto hierher ziehen/), {
      dataTransfer: {
        files: [],
        getData: (type: string) => (type === 'text/uri-list' ? 'https://example.org/foto.jpg' : ''),
      },
    })
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('https://example.org/foto.jpg'))
  })

  it('says so when a stored photo cannot be shown', () => {
    render(<ImageUpload value="https://www.hs-osnabrueck.de/seite/" onChange={vi.fn()} />)
    fireEvent.error(screen.getByAltText('Vorschau'))
    expect(screen.getByText(/Bild kann nicht angezeigt werden/)).toBeVisible()
  })
})
