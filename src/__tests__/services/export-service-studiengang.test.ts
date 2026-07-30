import { describe, it, expect } from 'vitest'
import { groupFlatRowsByProgram, type StudyProgramEventRow } from '@/services/export-service'

const row = (studiengang: string, titel: string, studienfeld = ''): StudyProgramEventRow => ({
  studiengang,
  studienfeld,
  titel,
  typ: 'Vortrag',
  institution: 'Universität',
  studiengaenge: studiengang,
  uhrzeit: '09:00 – 10:00',
  gebaeude: '',
  raum: '',
  dozent: '',
  beschreibung: '',
})

describe('groupFlatRowsByProgram', () => {
  it('groups rows under their Studiengang', () => {
    const grouped = groupFlatRowsByProgram([
      row('Biologie', 'Labor'),
      row('Chemie', 'Vortrag'),
      row('Biologie', 'Führung'),
    ])
    expect(Object.keys(grouped)).toEqual(['Biologie', 'Chemie'])
    expect(grouped['Biologie']).toHaveLength(2)
  })

  it('orders group keys in German order, umlauts not after Z', () => {
    const grouped = groupFlatRowsByProgram([
      row('Zahnmedizin', 'A'),
      row('Ökotrophologie', 'B'),
      row('Osteologie', 'C'),
    ])
    expect(Object.keys(grouped)).toEqual(['Ökotrophologie', 'Osteologie', 'Zahnmedizin'])
  })

  it('preserves the Studienfeld on every row', () => {
    const grouped = groupFlatRowsByProgram([row('Biologie', 'Labor', 'Biologie & Umwelt')])
    expect(grouped['Biologie'][0].studienfeld).toBe('Biologie & Umwelt')
  })
})
