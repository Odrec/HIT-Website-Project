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
  firstName: string
  lastName: string
  title: string
  email: string
  phone: string
  affiliation: string
  fakultaet: string
  fachbereich: string
  room: string
}

export const defaultMelderData: MelderData = {
  firstName: '',
  lastName: '',
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
  titleOptions?: string[]
}

const MELDER_TITLE_DATALIST_ID = 'melder-title-suggestions'

export function MelderSection({
  value,
  onChange,
  melderId,
  onMelderIdChange,
  titleOptions,
}: MelderSectionProps) {
  const [loaded, setLoaded] = useState(false)
  // Edit mode is latched on mount from the initial melderId. Required because
  // the create-mode path auto-links the current user's profile, which would
  // silently overwrite the event's original Melder on edit (regression).
  const [isEditMode] = useState(() => Boolean(melderId))

  useEffect(() => {
    if (loaded) return
    const controller = new AbortController()

    const populate = (melder: {
      firstName?: string | null
      lastName?: string | null
      title?: string | null
      email?: string | null
      phone?: string | null
      affiliation?: string | null
      fakultaet?: string | null
      fachbereich?: string | null
      room?: string | null
    }) => {
      onChange({
        firstName: melder.firstName || '',
        lastName: melder.lastName || '',
        title: melder.title || '',
        email: melder.email || '',
        phone: melder.phone || '',
        affiliation: melder.affiliation || '',
        fakultaet: melder.fakultaet || '',
        fachbereich: melder.fachbereich || '',
        room: melder.room || '',
      })
    }

    if (isEditMode && melderId) {
      fetch(`/api/melder/${melderId}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((melder) => {
          if (melder?.id) populate(melder)
        })
        .catch(() => {})
        .finally(() => setLoaded(true))
    } else {
      fetch('/api/melder', { signal: controller.signal })
        .then((res) => res.json())
        .then((melder) => {
          if (melder?.id) {
            onMelderIdChange(melder.id)
            populate(melder)
          }
        })
        .catch(() => {})
        .finally(() => setLoaded(true))
    }

    return () => controller.abort()
  }, [loaded, isEditMode, melderId, onChange, onMelderIdChange])

  const updateField = (field: keyof MelderData, val: string) => onChange({ ...value, [field]: val })
  // In edit mode the section is read-only: the linked Melder belongs to the
  // event's original submitter and must not be swapped for the editor's
  // profile. Profile changes go through the separate Melder profile page.
  const readOnly = isEditMode

  return (
    <Card className="border-l-4 border-l-hit-uni-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Melder-Profil</CardTitle>
        <CardDescription className="text-xs">
          {readOnly
            ? 'Ursprüngliche Einreicher-Daten. Nicht änderbar beim Bearbeiten.'
            : 'Wird automatisch aus Ihrem Profil ausgefüllt. Änderungen gelten nur für diese Veranstaltung.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>
              Vorname <span className="text-red-500">*</span>
            </Label>
            <Input
              value={value.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              readOnly={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Nachname <span className="text-red-500">*</span>
            </Label>
            <Input
              value={value.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              readOnly={readOnly}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Titel</Label>
            <Input
              value={value.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Dr., Prof., etc."
              readOnly={readOnly}
              list={titleOptions && titleOptions.length > 0 ? MELDER_TITLE_DATALIST_ID : undefined}
            />
            {titleOptions && titleOptions.length > 0 && (
              <datalist id={MELDER_TITLE_DATALIST_ID}>
                {titleOptions.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>
              E-Mail <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={value.email}
              onChange={(e) => updateField('email', e.target.value)}
              readOnly={readOnly}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Telefon</Label>
            <Input
              value={value.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              readOnly={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Zugehörigkeit <span className="text-red-500">*</span>
            </Label>
            <Select
              value={value.affiliation}
              onValueChange={(v) => updateField('affiliation', v)}
              disabled={readOnly}
            >
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
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Fakultät</Label>
            <Input
              value={value.fakultaet}
              onChange={(e) => updateField('fakultaet', e.target.value)}
              readOnly={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fachbereich</Label>
            <Input
              value={value.fachbereich}
              onChange={(e) => updateField('fachbereich', e.target.value)}
              readOnly={readOnly}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Raum</Label>
            <Input
              value={value.room}
              onChange={(e) => updateField('room', e.target.value)}
              readOnly={readOnly}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
