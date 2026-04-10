'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { eventTypeLabels } from '@/lib/validations/event'
import { formatEventTime } from '@/lib/event-time'

interface EventRow {
  id: string
  title: string
  eventType: string
  timeStart: string | null
  buildingId: string | null
  roomId: string | null
  building: { id: string; name: string } | null
  room: { id: string; name: string } | null
  studyPrograms: { studyProgram: { name: string } }[]
}

interface Building {
  id: string
  name: string
  rooms: { id: string; name: string; floor: string | null }[]
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function RoomAssignmentsPage() {
  const [events, setEvents] = useState<{ uni: EventRow[]; hs: EventRow[] }>({
    uni: [],
    hs: [],
  })
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [saveStatuses, setSaveStatuses] = useState<Record<string, SaveStatus>>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [uniRes, hsRes, buildingsRes] = await Promise.all([
        fetch('/api/events?pageSize=1000&institution=UNI'),
        fetch('/api/events?pageSize=1000&institution=HOCHSCHULE'),
        fetch('/api/buildings'),
      ])
      const [uniData, hsData, buildingsData] = await Promise.all([
        uniRes.json(),
        hsRes.json(),
        buildingsRes.json(),
      ])
      setEvents({
        uni: uniData.data || [],
        hs: hsData.data || [],
      })
      setBuildings(buildingsData || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const saveAssignment = useCallback(
    async (eventId: string, buildingId: string | null, roomId: string | null) => {
      setSaveStatuses((prev) => ({ ...prev, [eventId]: 'saving' }))
      try {
        const res = await fetch(`/api/events/${eventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buildingId, roomId }),
        })
        if (!res.ok) throw new Error('Save failed')
        const updated = await res.json()
        setEvents((prev) => ({
          uni: prev.uni.map((e) => (e.id === eventId ? { ...e, ...updated } : e)),
          hs: prev.hs.map((e) => (e.id === eventId ? { ...e, ...updated } : e)),
        }))
        setSaveStatuses((prev) => ({ ...prev, [eventId]: 'saved' }))
        setTimeout(() => {
          setSaveStatuses((prev) => ({ ...prev, [eventId]: 'idle' }))
        }, 2000)
      } catch {
        setSaveStatuses((prev) => ({ ...prev, [eventId]: 'error' }))
      }
    },
    []
  )

  const handleBuildingChange = useCallback(
    (event: EventRow, value: string) => {
      const buildingId = value === 'none' ? null : value
      saveAssignment(event.id, buildingId, null)
    },
    [saveAssignment]
  )

  const handleRoomChange = useCallback(
    (event: EventRow, value: string) => {
      const roomId = value === 'none' ? null : value
      saveAssignment(event.id, event.buildingId, roomId)
    },
    [saveAssignment]
  )

  const formatTime = (timeStart: string | null) => {
    if (!timeStart) return null
    return formatEventTime(timeStart)
  }

  const sortEvents = (eventList: EventRow[]) => {
    const withTime = eventList
      .filter((e) => e.timeStart)
      .sort((a, b) => new Date(a.timeStart!).getTime() - new Date(b.timeStart!).getTime())
    const withoutTime = eventList.filter((e) => !e.timeStart)
    return { withTime, withoutTime }
  }

  const renderTable = (eventList: EventRow[]) => {
    if (eventList.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-gray-500">
          Keine Veranstaltungen vorhanden
        </div>
      )
    }

    const { withTime, withoutTime } = sortEvents(eventList)

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-3 py-2 text-sm font-medium text-gray-500">Uhrzeit</th>
              <th className="px-3 py-2 text-sm font-medium text-gray-500">Titel</th>
              <th className="px-3 py-2 text-sm font-medium text-gray-500">Typ</th>
              <th className="px-3 py-2 text-sm font-medium text-gray-500">Studiengänge</th>
              <th className="px-3 py-2 text-sm font-medium text-gray-500">Gebäude</th>
              <th className="px-3 py-2 text-sm font-medium text-gray-500">Raum</th>
            </tr>
          </thead>
          <tbody>
            {withTime.map((event) => renderEventRow(event))}
            {withoutTime.length > 0 && (
              <tr className="bg-gray-50">
                <td colSpan={6} className="px-3 py-3 text-sm font-semibold text-gray-400">
                  Ohne Zeitangabe
                </td>
              </tr>
            )}
            {withoutTime.map((event) => renderEventRow(event))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderEventRow = (event: EventRow) => {
    const status = saveStatuses[event.id] || 'idle'
    const selectedBuilding = buildings.find((b) => b.id === event.buildingId)
    const rooms = selectedBuilding?.rooms || []
    const studyProgramNames = event.studyPrograms.map((sp) => sp.studyProgram.name).join(', ')

    return (
      <tr key={event.id} className="border-b hover:bg-gray-50">
        <td className="px-3 py-2 text-sm">{formatTime(event.timeStart) || '—'}</td>
        <td className="px-3 py-2 text-sm font-medium">{event.title}</td>
        <td className="px-3 py-2 text-sm">{eventTypeLabels[event.eventType] || event.eventType}</td>
        <td className="px-3 py-2 text-sm text-gray-500">{studyProgramNames || '—'}</td>
        <td className="px-3 py-2 text-sm">
          <Select
            value={event.buildingId || 'none'}
            onValueChange={(value) => handleBuildingChange(event, value)}
          >
            <SelectTrigger className="h-8 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {buildings.map((building) => (
                <SelectItem key={building.id} value={building.id}>
                  {building.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <Select
              value={event.roomId || 'none'}
              onValueChange={(value) => handleRoomChange(event, value)}
              disabled={!event.buildingId}
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                    {room.floor ? ` (${room.floor})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {status === 'saving' && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            {status === 'saved' && <Check className="h-4 w-4 text-green-500" />}
            {status === 'error' && (
              <AlertCircle
                className="h-4 w-4 cursor-pointer text-red-500"
                onClick={() => saveAssignment(event.id, event.buildingId, event.roomId)}
              />
            )}
          </div>
        </td>
      </tr>
    )
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Raumzuordnung</h1>
        <p className="text-muted-foreground">Veranstaltungen Gebäuden und Räumen zuordnen</p>
      </div>

      <Tabs defaultValue="uni">
        <TabsList>
          <TabsTrigger value="uni">Universität ({events.uni.length})</TabsTrigger>
          <TabsTrigger value="hs">Hochschule ({events.hs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="uni">{renderTable(events.uni)}</TabsContent>
        <TabsContent value="hs">{renderTable(events.hs)}</TabsContent>
      </Tabs>
    </div>
  )
}
