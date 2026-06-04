// src/app/(public)/bus-tracker/guide/page.tsx
'use client'

import { Suspense, useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Bus, MapPin, Wifi, WifiOff, AlertTriangle } from 'lucide-react'

type TrackingStatus = 'idle' | 'active' | 'paused' | 'error'

export default function GuideTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-hit-gray-50 p-4">
          <div className="max-w-md mx-auto mt-8">
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
        </div>
      }
    >
      <GuideTrackingContent />
    </Suspense>
  )
}

function GuideTrackingContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<TrackingStatus>(() => (token ? 'idle' : 'error'))
  const [error, setError] = useState<string | null>(() =>
    token ? null : 'Kein Token angegeben. Bitte verwenden Sie den Link vom Admin.'
  )
  const [busName, setBusName] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [heartbeatWarning, setHeartbeatWarning] = useState(false)
  const [online, setOnline] = useState(true)
  const [opPause, setOpPause] = useState<{ until: string | null } | null>(null)

  const watchIdRef = useRef<number | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const lastSendRef = useRef<number>(0)
  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tokenRef = useRef(token)
  useEffect(() => {
    tokenRef.current = token
  }, [token])

  // Validate token on mount
  useEffect(() => {
    if (!token) return

    fetch('/api/bus-positions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    }).then(async (res) => {
      if (res.status === 401) {
        setError('Ungültiger Link. Bitte kontaktieren Sie den Admin für einen neuen QR-Code.')
        setStatus('error')
      } else if (res.ok) {
        const data = await res.json()
        if (data.busName) setBusName(data.busName)
      }
    })
  }, [token])

  const resetHeartbeat = useCallback(() => {
    setHeartbeatWarning(false)
    if (heartbeatTimerRef.current) clearTimeout(heartbeatTimerRef.current)
    heartbeatTimerRef.current = setTimeout(() => {
      setHeartbeatWarning(true)
      try {
        const audioCtx = new AudioContext()
        const oscillator = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        oscillator.connect(gain)
        gain.connect(audioCtx.destination)
        oscillator.frequency.value = 800
        gain.gain.value = 0.3
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.3)
      } catch {
        // Audio not available
      }
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
    }, 30_000)
  }, [])

  const sendPosition = useCallback(
    async (lat: number, lng: number, heading?: number | null, speed?: number | null) => {
      const now = Date.now()
      if (now - lastSendRef.current < 3000) return

      lastSendRef.current = now

      try {
        const res = await fetch('/api/bus-positions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenRef.current}`,
          },
          body: JSON.stringify({ latitude: lat, longitude: lng, heading, speed }),
        })

        if (res.ok) {
          setLastUpdate(new Date())
          setPosition({ lat, lng })
          setOnline(true)
          resetHeartbeat()
        }
      } catch {
        setOnline(false)
      }
    },
    [resetHeartbeat]
  )

  const startTracking = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation wird von Ihrem Browser nicht unterstützt.')
      setStatus('error')
      return
    }

    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch {
      // Wake Lock not available
    }

    setStatus('active')
    setError(null)
    resetHeartbeat()

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        sendPosition(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.heading,
          pos.coords.speed
        )
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            'Standortzugriff verweigert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen.'
          )
          setStatus('error')
        } else {
          setStatus('paused')
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    )
  }, [sendPosition, resetHeartbeat])

  const callPause = useCallback(
    async (body: { mode: 'until'; minutes: number } | { mode: 'open' } | { mode: 'resume' }) => {
      try {
        const res = await fetch('/api/bus-positions/pause', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenRef.current}`,
          },
          body: JSON.stringify(body),
        })
        if (!res.ok) return false
        const data = await res.json()
        if (body.mode === 'resume') setOpPause(null)
        else setOpPause({ until: data.pausedUntil ?? null })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
      wakeLockRef.current = null
    }
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current)
    }
    setStatus('idle')
    setHeartbeatWarning(false)
  }, [])

  const handlePause = useCallback(
    async (mode: { mode: 'until'; minutes: number } | { mode: 'open' }) => {
      stopTracking()
      await callPause(mode)
    },
    [stopTracking, callPause]
  )

  const handleResume = useCallback(async () => {
    const ok = await callPause({ mode: 'resume' })
    if (ok) startTracking()
  }, [callPause, startTracking])

  const formatHM = (iso: string) =>
    new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

  // Re-acquire position when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'active') {
        if ('wakeLock' in navigator) {
          navigator.wakeLock
            .request('screen')
            .then((lock) => {
              wakeLockRef.current = lock
            })
            .catch(() => {})
        }
        resetHeartbeat()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [status, resetHeartbeat])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (wakeLockRef.current) wakeLockRef.current.release()
      if (heartbeatTimerRef.current) clearTimeout(heartbeatTimerRef.current)
    }
  }, [])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-red-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-red-800">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusColor = {
    idle: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  }

  const statusLabel = {
    idle: 'Bereit',
    active: 'Aktiv',
    paused: 'Kein Standort',
    error: 'Fehler',
  }

  return (
    <div className="min-h-screen bg-hit-gray-50 p-4">
      {heartbeatWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 text-center font-bold animate-pulse">
          <AlertTriangle className="inline h-5 w-5 mr-2" />
          Standortfreigabe unterbrochen! Bitte diese Seite im Vordergrund lassen.
        </div>
      )}

      <div className="max-w-md mx-auto space-y-4 mt-8">
        <Card>
          <CardHeader className="text-center">
            <Bus className="h-12 w-12 mx-auto text-hit-uni-500 mb-2" />
            <CardTitle className="text-xl">Shuttle-Bus Tracking</CardTitle>
            {busName && <p className="text-hit-gray-500">{busName}</p>}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Badge className={`text-lg px-4 py-2 ${statusColor[status]}`}>
                {statusLabel[status]}
              </Badge>
            </div>

            {opPause ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-amber-100 p-4 text-center">
                  <p className="text-lg font-bold text-amber-800">
                    {opPause.until ? `Pause bis ${formatHM(opPause.until)}` : 'Pausiert'}
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    Das Tracking ist angehalten. Tippe auf &bdquo;Weiter&ldquo;, wenn es weitergeht.
                  </p>
                </div>
                <Button
                  onClick={handleResume}
                  className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
                >
                  <MapPin className="mr-2 h-6 w-6" />
                  Weiter
                </Button>
              </div>
            ) : (
              <>
                {status === 'idle' || status === 'paused' ? (
                  <Button
                    onClick={startTracking}
                    className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
                  >
                    <MapPin className="mr-2 h-6 w-6" />
                    Tracking starten
                  </Button>
                ) : (
                  <Button
                    onClick={stopTracking}
                    variant="destructive"
                    className="w-full h-16 text-lg"
                  >
                    Tracking stoppen
                  </Button>
                )}

                <div className="space-y-2">
                  <p className="text-center text-sm text-hit-gray-500">Pause einlegen</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[15, 30, 45].map((m) => (
                      <Button
                        key={m}
                        variant="outline"
                        onClick={() => handlePause({ mode: 'until', minutes: m })}
                      >
                        +{m} min
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handlePause({ mode: 'open' })}
                  >
                    Pause (offen)
                  </Button>
                </div>
              </>
            )}

            <div className="flex items-center justify-center gap-2 text-sm">
              {online ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-green-700">Verbunden</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-red-700">Keine Verbindung</span>
                </>
              )}
            </div>

            {lastUpdate && (
              <p className="text-center text-sm text-hit-gray-500">
                Letzte Aktualisierung:{' '}
                {lastUpdate.toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            )}

            {position && (
              <p className="text-center text-xs text-hit-gray-400 font-mono">
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
