'use client'

import { useState } from 'react'
import {
  Settings,
  Calendar,
  Bell,
  Database,
  Save,
  RefreshCw,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function SettingsPage() {
  // Event settings
  const [eventDate, setEventDate] = useState('2026-11-14')
  const [eventStartTime, setEventStartTime] = useState('08:00')
  const [eventEndTime, setEventEndTime] = useState('18:00')
  const [defaultEventDuration, setDefaultEventDuration] = useState('60')

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [notifyOnNewEvent, setNotifyOnNewEvent] = useState(true)
  const [notifyOnEventChange, setNotifyOnEventChange] = useState(true)

  // System settings
  const [cacheEnabled, setCacheEnabled] = useState(true)
  const [cacheTtl, setCacheTtl] = useState('3600')

  // State
  const [saving, setSaving] = useState(false)
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false)
  const [clearingCache, setClearingCache] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      // In a real implementation, this would save to an API/database
      await new Promise((resolve) => setTimeout(resolve, 500))
      alert('Einstellungen gespeichert')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleClearCache = async () => {
    setClearingCache(true)
    try {
      const response = await fetch('/api/cache/clear', { method: 'POST' })
      if (response.ok) {
        setClearCacheDialogOpen(false)
        alert('Cache wurde geleert')
      } else {
        alert('Fehler beim Leeren des Caches')
      }
    } catch (error) {
      console.error('Failed to clear cache:', error)
      alert('Fehler beim Leeren des Caches')
    } finally {
      setClearingCache(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
          <p className="text-muted-foreground">
            Konfigurieren Sie die Anwendungseinstellungen
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Speichern...' : 'Speichern'}
        </Button>
      </div>

      {/* Event Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Veranstaltungseinstellungen
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie die Grundeinstellungen für den Hochschulinformationstag
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Datum des HIT</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventStartTime">Startzeit</Label>
              <Input
                id="eventStartTime"
                type="time"
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventEndTime">Endzeit</Label>
              <Input
                id="eventEndTime"
                type="time"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="defaultDuration">Standarddauer für Veranstaltungen</Label>
            <Select value={defaultEventDuration} onValueChange={setDefaultEventDuration}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Minuten</SelectItem>
                <SelectItem value="45">45 Minuten</SelectItem>
                <SelectItem value="60">60 Minuten</SelectItem>
                <SelectItem value="90">90 Minuten</SelectItem>
                <SelectItem value="120">120 Minuten</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Diese Dauer wird beim Erstellen neuer Veranstaltungen als Standard verwendet
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Benachrichtigungen
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie E-Mail-Benachrichtigungen für Administratoren
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emailNotifications"
              checked={emailNotifications}
              onCheckedChange={(checked) => setEmailNotifications(checked === true)}
            />
            <Label htmlFor="emailNotifications" className="font-normal">
              E-Mail-Benachrichtigungen aktivieren
            </Label>
          </div>

          {emailNotifications && (
            <div className="ml-6 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyOnNewEvent"
                  checked={notifyOnNewEvent}
                  onCheckedChange={(checked) => setNotifyOnNewEvent(checked === true)}
                />
                <Label htmlFor="notifyOnNewEvent" className="font-normal">
                  Bei neuen Veranstaltungen benachrichtigen
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyOnEventChange"
                  checked={notifyOnEventChange}
                  onCheckedChange={(checked) => setNotifyOnEventChange(checked === true)}
                />
                <Label htmlFor="notifyOnEventChange" className="font-normal">
                  Bei Änderungen an Veranstaltungen benachrichtigen
                </Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            System
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie Cache und Systemeinstellungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cacheEnabled"
              checked={cacheEnabled}
              onCheckedChange={(checked) => setCacheEnabled(checked === true)}
            />
            <Label htmlFor="cacheEnabled" className="font-normal">
              Redis-Cache aktivieren
            </Label>
          </div>

          {cacheEnabled && (
            <div className="space-y-2">
              <Label htmlFor="cacheTtl">Cache-Gültigkeitsdauer (TTL)</Label>
              <Select value={cacheTtl} onValueChange={setCacheTtl}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">5 Minuten</SelectItem>
                  <SelectItem value="900">15 Minuten</SelectItem>
                  <SelectItem value="1800">30 Minuten</SelectItem>
                  <SelectItem value="3600">1 Stunde</SelectItem>
                  <SelectItem value="7200">2 Stunden</SelectItem>
                  <SelectItem value="86400">24 Stunden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cache leeren</p>
              <p className="text-sm text-muted-foreground">
                Löscht alle gecachten Daten. Kann die Performance kurzzeitig beeinträchtigen.
              </p>
            </div>
            <Button variant="outline" onClick={() => setClearCacheDialogOpen(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Cache leeren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <Info className="h-5 w-5" />
            Über die Anwendung
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="font-medium">Version:</span>
            <span>1.0.0</span>
            <span className="font-medium">Umgebung:</span>
            <span>{process.env.NODE_ENV === 'production' ? 'Produktion' : 'Entwicklung'}</span>
            <span className="font-medium">Framework:</span>
            <span>Next.js 15</span>
            <span className="font-medium">Datenbank:</span>
            <span>PostgreSQL mit Prisma</span>
          </div>
        </CardContent>
      </Card>

      {/* Clear Cache Dialog */}
      <Dialog open={clearCacheDialogOpen} onOpenChange={setClearCacheDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cache leeren</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie den gesamten Cache leeren möchten? 
              Dies kann die Performance der Anwendung kurzzeitig beeinträchtigen, 
              da alle Daten neu aus der Datenbank geladen werden müssen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearCacheDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleClearCache} disabled={clearingCache}>
              {clearingCache ? 'Leeren...' : 'Cache leeren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
