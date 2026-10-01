'use client'

import type { ClipboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  parseCoordinate,
  splitCoordinatePair,
  isNearOsnabrueck,
  type CoordinateAxis,
} from '@/lib/coordinates'

export interface CoordinateValue {
  latitude: string
  longitude: string
}

interface CoordinateInputsProps {
  idPrefix: string
  value: CoordinateValue
  onChange: (value: CoordinateValue) => void
}

const FIELDS: { axis: CoordinateAxis; label: string; placeholder: string }[] = [
  { axis: 'latitude', label: 'Breitengrad', placeholder: 'z.B. 52.271234' },
  { axis: 'longitude', label: 'Längengrad', placeholder: 'z.B. 8.045678' },
]

/**
 * Latitude/longitude fields shared by the building and shuttle-stop forms.
 * Plain text inputs on purpose — see src/lib/coordinates.ts.
 */
export function CoordinateInputs({ idPrefix, value, onChange }: CoordinateInputsProps) {
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pair = splitCoordinatePair(e.clipboardData.getData('text'))
    if (!pair) return
    e.preventDefault()
    onChange(pair)
  }

  const parsed = {
    latitude: parseCoordinate(value.latitude, 'latitude'),
    longitude: parseCoordinate(value.longitude, 'longitude'),
  }
  const lat = 'value' in parsed.latitude ? parsed.latitude.value : null
  const lng = 'value' in parsed.longitude ? parsed.longitude.value : null
  const outsideOsnabrueck = lat !== null && lng !== null && !isNearOsnabrueck(lat, lng)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map(({ axis, label, placeholder }) => {
          const result = parsed[axis]
          const id = `${idPrefix}-${axis}`
          return (
            <div key={axis} className="space-y-2">
              <Label htmlFor={id}>{label}</Label>
              <Input
                id={id}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={value[axis]}
                onChange={(e) => onChange({ ...value, [axis]: e.target.value })}
                onPaste={handlePaste}
                placeholder={placeholder}
                aria-invalid={'error' in result}
              />
              {'error' in result && (
                <p role="alert" className="text-xs text-red-600">
                  {result.error}
                </p>
              )}
            </div>
          )
        })}
      </div>
      {outsideOsnabrueck && (
        <p className="text-xs text-amber-700">
          Diese Koordinaten liegen nicht in Osnabrück – bitte prüfen (Breiten- und Längengrad
          vertauscht?).
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Dezimalgrad mit bis zu 6 Nachkommastellen. In Google Maps per Rechtsklick auf den Ort die
        Koordinaten kopieren und hier einfügen – das Paar wird automatisch auf beide Felder
        verteilt.
      </p>
    </div>
  )
}
