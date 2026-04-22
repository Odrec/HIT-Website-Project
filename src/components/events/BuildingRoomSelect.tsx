'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Room {
  id: string
  name: string
  floor: string | null
}
interface Building {
  id: string
  name: string
  campus: string | null
  institution: 'UNI' | 'HOCHSCHULE' | 'BOTH'
  rooms: Room[]
}

interface BuildingRoomSelectProps {
  buildingId: string
  roomId: string
  onBuildingChange: (id: string) => void
  onRoomChange: (id: string) => void
  /** Event institution. Buildings whose institution doesn't match (and which
   *  aren't BOTH) are hidden from the dropdown. Undefined shows everything. */
  institution?: 'UNI' | 'HOCHSCHULE' | 'BOTH'
}

export function BuildingRoomSelect({
  buildingId,
  roomId,
  onBuildingChange,
  onRoomChange,
  institution,
}: BuildingRoomSelectProps) {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/buildings')
      .then((r) => r.json())
      .then(setBuildings)
      .finally(() => setLoading(false))
  }, [])

  const filteredBuildings = buildings.filter((b) => {
    if (!institution || institution === 'BOTH') return true
    return b.institution === institution || b.institution === 'BOTH'
  })
  const selectedBuilding = buildings.find((b) => b.id === buildingId)
  const rooms = selectedBuilding?.rooms ?? []

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Gebäude</Label>
        <Select
          value={buildingId}
          onValueChange={(v) => {
            onBuildingChange(v)
            onRoomChange('')
          }}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? 'Laden...' : 'Gebäude wählen'} />
          </SelectTrigger>
          <SelectContent>
            {filteredBuildings.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
                {b.campus && ` (${b.campus})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Raum</Label>
        <Select
          value={roomId}
          onValueChange={onRoomChange}
          disabled={!buildingId || rooms.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={!buildingId ? 'Erst Gebäude wählen' : 'Raum wählen'} />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
                {r.floor && ` (${r.floor})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
