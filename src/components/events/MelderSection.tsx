'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { affiliationLabels } from '@/lib/validations/melder'

export interface MelderData {
  name: string
  title: string
  email: string
  phone: string
  affiliation: string
  fakultaet: string
  fachbereich: string
  room: string
}

export const defaultMelderData: MelderData = {
  name: '',
  title: '',
  email: '',
  phone: '',
  affiliation: '',
  fakultaet: '',
  fachbereich: '',
  room: '',
}

interface MelderSectionProps {
  value: MelderData
  onChange: (data: MelderData) => void
  melderId: string | null
  onMelderIdChange: (id: string) => void
}

export function MelderSection({ value, onChange, melderId, onMelderIdChange }: MelderSectionProps) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded) return
    fetch('/api/melder')
      .then((res) => res.json())
      .then((melder) => {
        if (melder?.id) {
          onMelderIdChange(melder.id)
          onChange({
            name: melder.name || '',
            title: melder.title || '',
            email: melder.email || '',
            phone: melder.phone || '',
            affiliation: melder.affiliation || '',
            fakultaet: melder.fakultaet || '',
            fachbereich: melder.fachbereich || '',
            room: melder.room || '',
          })
        }
      })
      .finally(() => setLoaded(true))
  }, [loaded, onChange, onMelderIdChange])

  const updateField = (field: keyof MelderData, val: string) => onChange({ ...value, [field]: val })

  return (
    <Card className="border-l-4 border-l-hit-uni-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Melder-Profil</CardTitle>
        <CardDescription className="text-xs">
          Wird automatisch aus Ihrem Profil ausgefüllt. Änderungen gelten nur für diese
          Veranstaltung.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>
              Name <span className="text-red-500">*</span>
            </Label>
            <Input value={value.name} onChange={(e) => updateField('name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Titel</Label>
            <Input
              value={value.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Dr., Prof., etc."
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>
              E-Mail <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={value.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Telefon</Label>
            <Input value={value.phone} onChange={(e) => updateField('phone', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>
              Zugehörigkeit <span className="text-red-500">*</span>
            </Label>
            <Select value={value.affiliation} onValueChange={(v) => updateField('affiliation', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(affiliationLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fakultät</Label>
            <Input
              value={value.fakultaet}
              onChange={(e) => updateField('fakultaet', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Fachbereich</Label>
            <Input
              value={value.fachbereich}
              onChange={(e) => updateField('fachbereich', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Raum</Label>
            <Input value={value.room} onChange={(e) => updateField('room', e.target.value)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
