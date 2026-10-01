import { describe, it, expect } from 'vitest'
import { removeMarkdownSection } from '@/lib/help-content'

const manual = `# Anleitung

## Merkliste

Text A

## Studiengangs-Navigator

Der Navigator …

Noch ein Absatz.

## Routenplaner

Text B
`

describe('removeMarkdownSection', () => {
  it('drops the section up to the next level-2 heading', () => {
    expect(removeMarkdownSection(manual, 'Studiengangs-Navigator')).toBe(`# Anleitung

## Merkliste

Text A

## Routenplaner

Text B
`)
  })

  it('drops a trailing section', () => {
    expect(removeMarkdownSection(manual, 'Routenplaner')).not.toContain('Text B')
    expect(removeMarkdownSection(manual, 'Routenplaner')).toContain('Der Navigator')
  })

  it('leaves the text alone when the heading does not exist', () => {
    expect(removeMarkdownSection(manual, 'Gibt es nicht')).toBe(manual)
  })
})
