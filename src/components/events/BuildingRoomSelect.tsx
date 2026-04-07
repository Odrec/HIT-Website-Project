'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Room { id: string; name: string; floor: string | null }
interface Building { id: string; name: string; campus: string | null; rooms: Room[] }

interface BuildingRoomSelectProps {
  buildingId: string
  roomId: string
  onBuildingChange: (id: string) => void
  onRoomChange: (id: string) => void
}

export function BuildingRoomSelect({ buildingId, roomId, onBuildingChange, onRoomChange }: BuildingRoomSelectProps) {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/buildings').then(r => r.json()).then(setBuildings).finally(() => setLoading(false))
  }, [])

  const selectedBuilding = buildings.find(b => b.id === buildingId)
  const rooms = selectedBuilding?.rooms ?? []

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Gebaeude</Label>
        <Select value={buildingId} onValueChange={(v) => { onBuildingChange(v); onRoomChange('') }} disabled={loading}>
          <SelectTrigger><SelectValue placeholder={loading ? 'Laden...' : 'Gebaeude waehlen'} /></SelectTrigger>
          <SelectContent>
            {buildings.map(b => <SelectItem key={b.id} value={b.id}>{b.name}{b.campus && ` (${b.campus})`}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Raum</Label>
        <Select value={roomId} onValueChange={onRoomChange} disabled={!buildingId || rooms.length === 0}>
          <SelectTrigger><SelectValue placeholder={!buildingId ? 'Erst Gebaeude waehlen' : 'Raum waehlen'} /></SelectTrigger>
          <SelectContent>
            {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}{r.floor && ` (${r.floor})`}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
