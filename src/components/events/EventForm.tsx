'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, User, Mail, Phone, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select'
import {
  eventFormSchema,
  type EventFormValues,
  defaultEventValues,
  eventTypeLabels,
  locationTypeLabels,
  institutionLabels,
} from '@/lib/validations/event'

interface Location {
  id: string
  buildingName: string
  roomNumber: string | null
}

interface StudyProgram {
  id: string
  name: string
  institution: string
  cluster?: { name: string } | null
}

interface InfoMarket {
  id: string
  name: string
  location: string
}

interface EventFormProps {
  initialData?: Partial<EventFormValues> & { id?: string }
  onSubmit: (data: EventFormValues) => Promise<void>
  isSubmitting?: boolean
}

export function EventForm({ initialData, onSubmit, isSubmitting = false }: EventFormProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([])
  const [infoMarkets, setInfoMarkets] = useState<InfoMarket[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      ...defaultEventValues,
      ...initialData,
    } as EventFormValues,
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form

  const {
    fields: lecturerFields,
    append: appendLecturer,
    remove: removeLecturer,
  } = useFieldArray({
    control,
    name: 'lecturers',
  })

  const {
    fields: organizerFields,
    append: appendOrganizer,
    remove: removeOrganizer,
  } = useFieldArray({
    control,
    name: 'organizers',
  })

  const watchEventType = watch('eventType')
  const watchLocationType = watch('locationType')
  const watchInstitution = watch('institution')

  // Fetch reference data
  useEffect(() => {
    async function fetchData() {
      try {
        const [locationsRes, programsRes, marketsRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/study-programs'),
          fetch('/api/locations/info-markets'),
        ])

        const locationsData = await locationsRes.json()
        const programsData = await programsRes.json()
        const marketsData = await marketsRes.json()

        setLocations(Array.isArray(locationsData) ? locationsData : [])
        setStudyPrograms(Array.isArray(programsData) ? programsData : [])
        setInfoMarkets(Array.isArray(marketsData) ? marketsData : [])
      } catch (error) {
        console.error('Error fetching reference data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Convert study programs to multi-select options
  const studyProgramOptions: MultiSelectOption[] = studyPrograms
    .filter((sp) => {
      if (watchInstitution === 'BOTH') return true
      return sp.institution === watchInstitution
    })
    .map((sp) => ({
      value: sp.id,
      label: sp.name,
      group: sp.cluster?.name || (sp.institution === 'UNI' ? 'Universität' : 'Hochschule'),
    }))

  // Convert info markets to multi-select options
  const infoMarketOptions: MultiSelectOption[] = infoMarkets.map((im) => ({
    value: im.id,
    label: `${im.name} (${im.location})`,
  }))

  const [dateError, setDateError] = useState<string | null>(null)

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDateError(null)

    const formData = form.getValues()

    // Validate that end date is after start date
    if (formData.timeStart && formData.timeEnd) {
      if (formData.timeEnd <= formData.timeStart) {
        setDateError('Das Enddatum muss nach dem Startdatum liegen.')
        return
      }
    }

    await onSubmit(formData as EventFormValues)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Grundinformationen</CardTitle>
          <CardDescription>Titel, Typ und Beschreibung der Veranstaltung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Titel <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Name der Veranstaltung"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            <p className="text-xs text-gray-500">{watch('title')?.length || 0}/200 Zeichen</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="eventType">
                Veranstaltungstyp <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('eventType')}
                onValueChange={(value) =>
                  setValue('eventType', value as EventFormValues['eventType'])
                }
              >
                <SelectTrigger className={errors.eventType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Typ auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.eventType && (
                <p className="text-sm text-red-500">{errors.eventType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">
                Institution <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('institution')}
                onValueChange={(value) =>
                  setValue('institution', value as EventFormValues['institution'])
                }
              >
                <SelectTrigger className={errors.institution ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Institution auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(institutionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.institution && (
                <p className="text-sm text-red-500">{errors.institution.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationType">
                Ortstyp <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('locationType')}
                onValueChange={(value) =>
                  setValue('locationType', value as EventFormValues['locationType'])
                }
              >
                <SelectTrigger className={errors.locationType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Ortstyp auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(locationTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.locationType && (
                <p className="text-sm text-red-500">{errors.locationType.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Ausführliche Beschreibung der Veranstaltung..."
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
            <p className="text-xs text-gray-500">
              {watch('description')?.length || 0}/5000 Zeichen
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Time & Location */}
      {watchEventType !== 'LINK' && (
        <Card>
          <CardHeader>
            <CardTitle>Zeit & Ort</CardTitle>
            <CardDescription>Wann und wo findet die Veranstaltung statt?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Beginn</Label>
                <DateTimePicker
                  value={watch('timeStart') || undefined}
                  onChange={(date) => setValue('timeStart', date || null)}
                  placeholder="Startzeit auswählen"
                />
              </div>
              <div className="space-y-2">
                <Label>Ende</Label>
                <DateTimePicker
                  value={watch('timeEnd') || undefined}
                  onChange={(date) => setValue('timeEnd', date || null)}
                  placeholder="Endzeit auswählen"
                />
                {errors.timeEnd && <p className="text-sm text-red-500">{errors.timeEnd.message}</p>}
              </div>
            </div>

            {dateError && (
              <div className="rounded-lg bg-red-50 p-3 text-red-700">
                <p className="text-sm font-medium">{dateError}</p>
              </div>
            )}

            {watchLocationType === 'OTHER' && (
              <div className="space-y-2">
                <Label htmlFor="locationId">Gebäude/Raum</Label>
                <Select
                  value={watch('locationId') || 'none'}
                  onValueChange={(value) =>
                    setValue('locationId', value === 'none' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Standort auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Standort</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.buildingName}
                        {loc.roomNumber && ` - ${loc.roomNumber}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="meetingPoint">Treffpunkt</Label>
              <Input
                id="meetingPoint"
                {...register('meetingPoint')}
                placeholder="z.B. Foyer des Hauptgebäudes"
              />
              {errors.meetingPoint && (
                <p className="text-sm text-red-500">{errors.meetingPoint.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomRequest">Raumanfrage (intern)</Label>
              <Textarea
                id="roomRequest"
                {...register('roomRequest')}
                placeholder="Raumwünsche und -anforderungen..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Programs */}
      <Card>
        <CardHeader>
          <CardTitle>Studiengänge</CardTitle>
          <CardDescription>
            Welche Studiengänge werden bei dieser Veranstaltung vorgestellt?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MultiSelect
            options={studyProgramOptions}
            value={watch('studyProgramIds') || []}
            onChange={(value) => setValue('studyProgramIds', value)}
            placeholder="Studiengänge auswählen..."
            searchPlaceholder="Studiengang suchen..."
            emptyText="Keine Studiengänge gefunden"
          />
        </CardContent>
      </Card>

      {/* Info Markets (for INFOSTAND type) */}
      {watchEventType === 'INFOSTAND' && (
        <Card>
          <CardHeader>
            <CardTitle>Infomärkte</CardTitle>
            <CardDescription>An welchen Infomärkten nimmt dieser Stand teil?</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiSelect
              options={infoMarketOptions}
              value={watch('infoMarketIds') || []}
              onChange={(value) => setValue('infoMarketIds', value)}
              placeholder="Infomärkte auswählen..."
            />
          </CardContent>
        </Card>
      )}

      {/* Lecturers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Dozenten / Referenten</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendLecturer({
                  firstName: '',
                  lastName: '',
                  title: '',
                  email: '',
                  building: '',
                  roomNumber: '',
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Dozent hinzufügen
            </Button>
          </CardTitle>
          <CardDescription>
            Wer hält die Veranstaltung oder führt durch das Programm?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lecturerFields.length === 0 ? (
            <p className="text-sm text-gray-500">Keine Dozenten hinzugefügt</p>
          ) : (
            lecturerFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Dozent {index + 1}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLecturer(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Titel</Label>
                    <Input {...register(`lecturers.${index}.title`)} placeholder="Prof. Dr." />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Vorname <span className="text-red-500">*</span>
                    </Label>
                    <Input {...register(`lecturers.${index}.firstName`)} placeholder="Max" />
                    {errors.lecturers?.[index]?.firstName && (
                      <p className="text-sm text-red-500">
                        {errors.lecturers[index].firstName?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Nachname <span className="text-red-500">*</span>
                    </Label>
                    <Input {...register(`lecturers.${index}.lastName`)} placeholder="Mustermann" />
                    {errors.lecturers?.[index]?.lastName && (
                      <p className="text-sm text-red-500">
                        {errors.lecturers[index].lastName?.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>E-Mail</Label>
                    <Input
                      type="email"
                      {...register(`lecturers.${index}.email`)}
                      placeholder="max.mustermann@uni.de"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gebäude</Label>
                    <Input
                      {...register(`lecturers.${index}.building`)}
                      placeholder="Hauptgebäude"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Raum</Label>
                    <Input {...register(`lecturers.${index}.roomNumber`)} placeholder="A101" />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Organizers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ansprechpartner (intern)</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendOrganizer({
                  email: '',
                  phone: '',
                  internalOnly: true,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Ansprechpartner hinzufügen
            </Button>
          </CardTitle>
          <CardDescription>Interne Kontaktpersonen für die Organisation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organizerFields.length === 0 ? (
            <p className="text-sm text-gray-500">Keine Ansprechpartner hinzugefügt</p>
          ) : (
            organizerFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Ansprechpartner {index + 1}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOrganizer(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-Mail <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      {...register(`organizers.${index}.email`)}
                      placeholder="kontakt@zsb.de"
                    />
                    {errors.organizers?.[index]?.email && (
                      <p className="text-sm text-red-500">
                        {errors.organizers[index].email?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefon
                    </Label>
                    <Input
                      {...register(`organizers.${index}.phone`)}
                      placeholder="+49 541 123456"
                    />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`organizers.${index}.internalOnly`}
                        checked={watch(`organizers.${index}.internalOnly`)}
                        onCheckedChange={(checked) =>
                          setValue(`organizers.${index}.internalOnly`, checked as boolean)
                        }
                      />
                      <Label htmlFor={`organizers.${index}.internalOnly`}>
                        Nur intern sichtbar
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Zusätzliche Informationen</CardTitle>
          <CardDescription>Weitere Details und Medien</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Zusätzliche Hinweise</Label>
            <Textarea
              id="additionalInfo"
              {...register('additionalInfo')}
              placeholder="Weitere wichtige Informationen für Besucher..."
              rows={3}
            />
            {errors.additionalInfo && (
              <p className="text-sm text-red-500">{errors.additionalInfo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="photoUrl">Bild-URL</Label>
            <Input id="photoUrl" {...register('photoUrl')} placeholder="https://..." />
            {errors.photoUrl && <p className="text-sm text-red-500">{errors.photoUrl.message}</p>}
            <p className="text-xs text-gray-500">
              URL zu einem Bild der Veranstaltung oder des Dozenten
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <Separator />
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Abbrechen
        </Button>
        <Button type="submit" variant="uni" disabled={isSubmitting}>
          {isSubmitting
            ? 'Speichern...'
            : initialData?.id
              ? 'Änderungen speichern'
              : 'Veranstaltung erstellen'}
        </Button>
      </div>
    </form>
  )
}

export default EventForm
