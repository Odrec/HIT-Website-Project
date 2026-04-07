'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface TimeGridPickerProps {
  value: string
  onChange: (value: string) => void
  label: string
  required?: boolean
  disabled?: boolean
}

function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 20 && m > 0) break
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

export function TimeGridPicker({ value, onChange, label, required, disabled }: TimeGridPickerProps) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Uhrzeit wählen" />
        </SelectTrigger>
        <SelectContent>
          {TIME_SLOTS.map((time) => (
            <SelectItem key={time} value={time}>
              {time} Uhr
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
