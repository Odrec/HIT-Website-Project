import { describe, it, expect } from 'vitest'
import { parseNavigatorReply } from '@/lib/navigator-reply'

describe('parseNavigatorReply', () => {
  it('returns plain text when there is no trailer', () => {
    const r = parseNavigatorReply('Hallo! Was interessiert dich?')
    expect(r).toEqual({ text: 'Hallo! Was interessiert dich?' })
  })

  it('extracts OPTIONS objects and strips the trailer', () => {
    const r = parseNavigatorReply(
      'Was spricht dich an?\nOPTIONS: [{"option":"Praktisch arbeiten","description":"z.B. Technik"},{"option":"Forschen"}]'
    )
    expect(r.text).toBe('Was spricht dich an?')
    expect(r.options).toEqual([
      { label: 'Praktisch arbeiten', description: 'z.B. Technik' },
      { label: 'Forschen' },
    ])
    expect(r.recommendation).toBeUndefined()
  })

  it('accepts OPTIONS given as plain strings', () => {
    const r = parseNavigatorReply('Frage?\nOPTIONS: ["A", "B"]')
    expect(r.options).toEqual([{ label: 'A' }, { label: 'B' }])
  })

  it('extracts EMPFEHLUNG and strips the trailer', () => {
    const r = parseNavigatorReply(
      'Hier meine Vorschläge.\n\nEMPFEHLUNG: {"programs":[{"id":"P12","reason":"Passt zu Bio"},{"id":"P3","reason":"Praxis"}],"summary":"Du magst Natur."}'
    )
    expect(r.text).toBe('Hier meine Vorschläge.')
    expect(r.recommendation).toEqual({
      programs: [
        { id: 'P12', reason: 'Passt zu Bio' },
        { id: 'P3', reason: 'Praxis' },
      ],
      summary: 'Du magst Natur.',
    })
  })

  it('tolerates a trailer wrapped in a code fence and trailing whitespace', () => {
    const r = parseNavigatorReply('Frage?\n```\nOPTIONS: [{"option":"A"}]\n```\n  ')
    expect(r.text).toBe('Frage?')
    expect(r.options).toEqual([{ label: 'A' }])
  })

  it('tolerates a bold-wrapped trailer', () => {
    const r = parseNavigatorReply('Frage?\n**OPTIONS:** [{"option":"A"}]')
    expect(r.options).toEqual([{ label: 'A' }])
  })

  it('treats malformed JSON as no trailer but still strips the line', () => {
    const r = parseNavigatorReply('Frage?\nOPTIONS: [{"option":"A",]')
    expect(r.text).toBe('Frage?')
    expect(r.options).toBeUndefined()
  })

  it('drops EMPFEHLUNG entries without a string id and defaults summary to empty', () => {
    const r = parseNavigatorReply(
      'X\nEMPFEHLUNG: {"programs":[{"id":"P1"},{"reason":"no id"},{"id":5}]}'
    )
    expect(r.recommendation).toEqual({ programs: [{ id: 'P1', reason: '' }], summary: '' })
  })

  it('ignores a trailer keyword that is not on the last line', () => {
    const r = parseNavigatorReply('OPTIONS: sind Auswahlmöglichkeiten.\nWas magst du?')
    expect(r.text).toBe('OPTIONS: sind Auswahlmöglichkeiten.\nWas magst du?')
    expect(r.options).toBeUndefined()
  })
})
