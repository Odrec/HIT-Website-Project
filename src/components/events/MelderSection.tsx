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
import { affiliationLabels, organisationseinheitLabel } from '@/lib/validations/melder'
import { MelderPicker, type MelderOption } from '@/components/events/MelderPicker'

export interface MelderData {
  firstName: string
  lastName: string
  title: string
  email: string
  phone: string
  affiliation: string
  organisationseinheit: string
  room: string
  adresse: string
}

export const defaultMelderData: MelderData = {
  firstName: '',
  lastName: '',
  title: '',
  email: '',
  phone: '',
  affiliation: '',
  organisationseinheit: '',
  room: '',
  adresse: '',
}

interface MelderSectionProps {
  value: MelderData
  onChange: (data: MelderData) => void
  melderId: string | null
  onMelderIdChange: (id: string) => void
  titleOptions?: string[]
  /** Show the "existing Melder*in" picker. ADMIN only — see /api/melder/options. */
  canPickExisting?: boolean
  /**
   * Latched on mount from the initial melderId, by EventForm. Required
   * because the create-mode path auto-links the current user's profile,
   * which would silently overwrite the event's original Melder on edit
   * (regression). EventForm computes this once and reuses it for the
   * persist guard, so there is a single source of truth.
   */
  readOnly?: boolean
}

const MELDER_TITLE_DATALIST_ID = 'melder-title-suggestions'

export function MelderSection({
  value,
  onChange,
  melderId,
  onMelderIdChange,
  titleOptions,
  canPickExisting = false,
  readOnly = false,
}: MelderSectionProps) {
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const populateFrom = (melder: {
    firstName?: string | null
    lastName?: string | null
    title?: string | null
    email?: string | null
    phone?: string | null
    affiliation?: string | null
    organisationseinheit?: string | null
    room?: string | null
    adresse?: string | null
  }) => {
    onChange({
      firstName: melder.firstName || '',
      lastName: melder.lastName || '',
      title: melder.title || '',
      email: melder.email || '',
      phone: melder.phone || '',
      affiliation: melder.affiliation || '',
      organisationseinheit: melder.organisationseinheit || '',
      room: melder.room || '',
      adresse: melder.adresse || '',
    })
  }

  // Picking an existing Melder links the record and copies its data in.
  // Because readOnly is latched (in EventForm) from the mount-time melderId,
  // this does NOT turn the fields read-only — the editor can still correct
  // them, and EventForm's upsert-by-email then updates the linked record.
  const handlePickExisting = (melder: MelderOption) => {
    onMelderIdChange(melder.id)
    populateFrom(melder)
  }

  const handleResetMelder = () => {
    onMelderIdChange('')
    onChange({ ...defaultMelderData })
  }

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
      organisationseinheit?: string | null
      room?: string | null
      adresse?: string | null
    }) => {
      onChange({
        firstName: melder.firstName || '',
        lastName: melder.lastName || '',
        title: melder.title || '',
        email: melder.email || '',
        phone: melder.phone || '',
        affiliation: melder.affiliation || '',
        organisationseinheit: melder.organisationseinheit || '',
        room: melder.room || '',
        adresse: melder.adresse || '',
      })
    }

    if (readOnly && melderId) {
      fetch(`/api/melder/${melderId}`, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) {
            setLoadError(
              res.status === 403
                ? 'Keine Berechtigung, das Melder-Profil zu laden.'
                : 'Melder-Profil konnte nicht geladen werden.'
            )
            return null
          }
          return res.json()
        })
        .then((melder) => {
          if (melder?.id) populate(melder)
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name !== 'AbortError') {
            setLoadError('Melder-Profil konnte nicht geladen werden.')
          }
        })
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
  }, [loaded, readOnly, melderId, onChange, onMelderIdChange])

  const updateField = (field: keyof MelderData, val: string) => onChange({ ...value, [field]: val })

  return (
    <Card className="border-l-4 border-l-hit-uni-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Melder-Profil</CardTitle>
        <CardDescription className="text-xs">
          {readOnly
            ? 'Ursprüngliche Einreicher-Daten. Nicht änderbar beim Bearbeiten.'
            : 'Bestehende Melder*in übernehmen oder Daten neu eingeben. Änderungen aktualisieren den Melder-Datensatz.'}
        </CardDescription>
        {loadError && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {loadError}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {canPickExisting && !readOnly && (
          <MelderPicker
            selectedId={melderId}
            onSelect={handlePickExisting}
            onReset={handleResetMelder}
            disabled={readOnly}
          />
        )}
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
        {/* The organizational-unit field is relabelled by affiliation, and
            external organisers get an address instead of a room. The fields
            only appear once an affiliation has been chosen. */}
        {value.affiliation && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{organisationseinheitLabel(value.affiliation)}</Label>
              <Input
                value={value.organisationseinheit}
                onChange={(e) => updateField('organisationseinheit', e.target.value)}
                readOnly={readOnly}
              />
            </div>
            {value.affiliation === 'EXTERN' ? (
              <div className="space-y-1.5">
                <Label>Adresse</Label>
                <Input
                  value={value.adresse}
                  onChange={(e) => updateField('adresse', e.target.value)}
                  readOnly={readOnly}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Raum</Label>
                <Input
                  value={value.room}
                  onChange={(e) => updateField('room', e.target.value)}
                  readOnly={readOnly}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
