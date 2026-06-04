'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Bus, Plus, RefreshCw, Trash2, QrCode, Power, PowerOff } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface ShuttleBus {
  id: string
  name: string
  number: number
  token: string
  active: boolean
  pausedUntil: string | null
  pausedIndefinitely: boolean
  position: {
    latitude: number
    longitude: number
    updatedAt: string
  } | null
}

export default function ShuttleBusesPage() {
  const [buses, setBuses] = useState<ShuttleBus[]>([])
  const [loading, setLoading] = useState(true)
  const [showQr, setShowQr] = useState<string | null>(null)
  const [newBusName, setNewBusName] = useState('')
  const [newBusNumber, setNewBusNumber] = useState('')

  const fetchBuses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/shuttle-buses')
      if (res.ok) {
        const data = await res.json()
        setBuses(data)
      }
    } catch (error) {
      console.error('Failed to fetch buses:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBuses()
    const interval = setInterval(fetchBuses, 10_000)
    return () => clearInterval(interval)
  }, [fetchBuses])

  const createBus = async () => {
    if (!newBusName || !newBusNumber) return

    const res = await fetch('/api/admin/shuttle-buses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newBusName, number: parseInt(newBusNumber, 10) }),
    })

    if (res.ok) {
      setNewBusName('')
      setNewBusNumber('')
      await fetchBuses()
    }
  }

  const toggleBus = async (id: string, active: boolean) => {
    await fetch(`/api/admin/shuttle-buses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    await fetchBuses()
  }

  const resumePause = async (id: string) => {
    await fetch(`/api/admin/shuttle-buses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume: true }),
    })
    await fetchBuses()
  }

  const deleteBus = async (id: string) => {
    if (!confirm('Bus wirklich löschen?')) return
    await fetch(`/api/admin/shuttle-buses/${id}`, { method: 'DELETE' })
    await fetchBuses()
  }

  const regenerateToken = async (id: string) => {
    if (!confirm('Token neu generieren? Der alte QR-Code wird ungültig.')) return
    await fetch(`/api/admin/shuttle-buses/${id}/regenerate-token`, { method: 'POST' })
    await fetchBuses()
  }

  const getGuideUrl = (token: string) => {
    return `${window.location.origin}/bus-tracker/guide?token=${token}`
  }

  const getTrackingStatus = (bus: ShuttleBus) => {
    if (bus.pausedIndefinitely) return { label: 'Pausiert', color: 'bg-amber-100 text-amber-800' }
    if (bus.pausedUntil && new Date(bus.pausedUntil).getTime() > Date.now()) {
      const hm = new Date(bus.pausedUntil).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return { label: `Pausiert bis ${hm}`, color: 'bg-amber-100 text-amber-800' }
    }
    if (!bus.active) return { label: 'Deaktiviert', color: 'bg-gray-100 text-gray-800' }
    if (!bus.position) return { label: 'Kein Signal', color: 'bg-yellow-100 text-yellow-800' }
    const age = Date.now() - new Date(bus.position.updatedAt).getTime()
    if (age > 60_000) return { label: 'Veraltet', color: 'bg-red-100 text-red-800' }
    return { label: 'Aktiv', color: 'bg-green-100 text-green-800' }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Shuttle-Busse</h1>
        <p className="text-hit-gray-500">Laden...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shuttle-Busse</h1>
        <Badge variant="outline">{buses.length} Busse</Badge>
      </div>

      {/* Add new bus */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Neuen Bus hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Name (z.B. Bus 1)"
              value={newBusName}
              onChange={(e) => setNewBusName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Nr."
              type="number"
              value={newBusNumber}
              onChange={(e) => setNewBusNumber(e.target.value)}
              className="w-20"
            />
            <Button onClick={createBus} disabled={!newBusName || !newBusNumber}>
              <Plus className="h-4 w-4 mr-1" />
              Hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bus list */}
      {buses.map((bus) => {
        const trackingStatus = getTrackingStatus(bus)

        return (
          <Card key={bus.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hit-uni-100 text-hit-uni-600">
                    <Bus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{bus.name}</h3>
                    <p className="text-sm text-hit-gray-500">Nr. {bus.number}</p>
                  </div>
                </div>

                <Badge className={trackingStatus.color}>{trackingStatus.label}</Badge>
              </div>

              {bus.position && (
                <p className="mt-3 text-sm text-hit-gray-500">
                  Letzte Position: {bus.position.latitude.toFixed(5)},{' '}
                  {bus.position.longitude.toFixed(5)}
                  {' — '}
                  {new Date(bus.position.updatedAt).toLocaleTimeString('de-DE')}
                </p>
              )}

              {showQr === bus.id && (
                <div className="mt-4 p-4 bg-white border rounded-lg flex flex-col items-center gap-2">
                  <QRCodeSVG value={getGuideUrl(bus.token)} size={200} />
                  <p className="text-xs text-hit-gray-400 break-all max-w-[250px] text-center">
                    {getGuideUrl(bus.token)}
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQr(showQr === bus.id ? null : bus.id)}
                >
                  <QrCode className="h-4 w-4 mr-1" />
                  {showQr === bus.id ? 'QR ausblenden' : 'QR-Code'}
                </Button>

                <Button variant="outline" size="sm" onClick={() => regenerateToken(bus.id)}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Neuer Token
                </Button>

                <Button variant="outline" size="sm" onClick={() => toggleBus(bus.id, !bus.active)}>
                  {bus.active ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-1" />
                      Deaktivieren
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-1" />
                      Aktivieren
                    </>
                  )}
                </Button>

                {(bus.pausedIndefinitely ||
                  (bus.pausedUntil && new Date(bus.pausedUntil).getTime() > Date.now())) && (
                  <Button variant="outline" size="sm" onClick={() => resumePause(bus.id)}>
                    Pause aufheben
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => deleteBus(bus.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Löschen
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {buses.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-hit-gray-500">
            <Bus className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Noch keine Shuttle-Busse angelegt.</p>
            <p className="text-sm">Fügen Sie oben einen neuen Bus hinzu.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
