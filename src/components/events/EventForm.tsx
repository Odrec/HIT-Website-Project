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
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select'
import {
  eventFormSchema,
  type EventFormValues,
  defaultEventValues,
  eventTypeLabels,
  locationTypeLabels,
  institutionLabels,
} from '@/lib/validations/event'
import { MelderSection, defaultMelderData, type MelderData } from '@/components/events/MelderSection'
import { TimeGridPicker } from '@/components/events/TimeGridPicker'
import { BuildingRoomSelect } from '@/components/events/BuildingRoomSelect'
import { ImageUpload } from '@/components/events/ImageUpload'

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

  // Melder state (not part of form schema, display-only)
  const [melderData, setMelderData] = useState<MelderData>(defaultMelderData)
  const [melderId, setMelderId] = useState<string | null>(
    (initialData?.melderId as string) || null
  )

  // Date/time separate state for combining on submit
  const [dateStr, setDateStr] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const form = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      ...defaultEventValues,
      ...initialData,
    } as EventFormValues,
  })

  const {
    register,
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
  const watchIsCrossProgram = watch('isCrossProgram')

  // Fetch reference data + HIT date
  useEffect(() => {
    async function fetchData() {
      try {
        const [locationsRes, programsRes, marketsRes, settingsRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/study-programs'),
          fetch('/api/locations/info-markets'),
          fetch('/api/settings'),
        ])

        const locationsData = await locationsRes.json()
        const programsData = await programsRes.json()
        const marketsData = await marketsRes.json()
        const settingsData = await settingsRes.json()

        setLocations(Array.isArray(locationsData) ? locationsData : [])
        setStudyPrograms(Array.isArray(programsData) ? programsData : [])
        setInfoMarkets(Array.isArray(marketsData) ? marketsData : [])

        // Pre-fill date from settings if no initial data
        if (settingsData?.hitDate && !initialData?.timeStart) {
          const hitDate = new Date(settingsData.hitDate)
          const formatted = hitDate.toISOString().split('T')[0]
          setDateStr(formatted)
        }

        // If editing, extract date/time from initialData
        if (initialData?.timeStart) {
          const start = new Date(initialData.timeStart)
          setDateStr(start.toISOString().split('T')[0])
          setStartTime(
            `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
          )
        }
        if (initialData?.timeEnd) {
          const end = new Date(initialData.timeEnd)
          setEndTime(
            `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
          )
        }
      } catch (error) {
        console.error('Error fetching reference data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clear studyProgramIds when isCrossProgram is checked
  useEffect(() => {
    if (watchIsCrossProgram) {
      setValue('studyProgramIds', [])
    }
  }, [watchIsCrossProgram, setValue])

  // Update melderId in form when melder changes
  useEffect(() => {
    if (melderId) {
      setValue('melderId', melderId)
    }
  }, [melderId, setValue])

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

    // Combine date + time into ISO strings
    if (dateStr && startTime) {
      formData.timeStart = new Date(`${dateStr}T${startTime}:00`)
    }
    if (dateStr && endTime) {
      formData.timeEnd = new Date(`${dateStr}T${endTime}:00`)
    }

    // Validate that end time is after start time
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
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Row 1: Melder + Veranstaltungsinfo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Section 1: Melder-Profil */}
        <MelderSection
          value={melderData}
          onChange={setMelderData}
          melderId={melderId}
          onMelderIdChange={setMelderId}
        />

        {/* Section 2: Veranstaltungsinfo */}
        <Card className="border-l-4 border-l-hit-hs-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Veranstaltungsinfo</CardTitle>
            <CardDescription className="text-xs">
              Titel, Typ und Beschreibung der Veranstaltung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Ausführliche Beschreibung der Veranstaltung..."
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
              <p className="text-xs text-gray-500">
                {watch('description')?.length || 0}/5000 Zeichen
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
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

              <div className="space-y-1.5">
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
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCrossProgram"
                checked={watch('isCrossProgram')}
                onCheckedChange={(checked) => setValue('isCrossProgram', checked as boolean)}
              />
              <Label htmlFor="isCrossProgram">Studiengangsübergreifend</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Datum & Uhrzeit + Ort */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Section 3: Datum & Uhrzeit */}
        <Card className="border-l-4 border-l-[#FBB900]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Datum & Uhrzeit</CardTitle>
            <CardDescription className="text-xs">
              Wann findet die Veranstaltung statt?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="eventDate">
                Datum <span className="text-red-500">*</span>
              </Label>
              <Input
                id="eventDate"
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TimeGridPicker
                value={startTime}
                onChange={setStartTime}
                label="Beginn"
                required
              />
              <TimeGridPicker
                value={endTime}
                onChange={setEndTime}
                label="Ende"
                required
              />
            </div>
            {dateError && (
              <div className="rounded-lg bg-red-50 p-3 text-red-700">
                <p className="text-sm font-medium">{dateError}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Ort */}
        <Card className="border-l-4 border-l-[#465765]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ort</CardTitle>
            <CardDescription className="text-xs">
              Wo findet die Veranstaltung statt?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <BuildingRoomSelect
              buildingId={watch('buildingId') || ''}
              roomId={watch('roomId') || ''}
              onBuildingChange={(id) => setValue('buildingId', id)}
              onRoomChange={(id) => setValue('roomId', id)}
            />

            <div className="space-y-1.5">
              <Label htmlFor="locationHint">Ortshinweis</Label>
              <Input
                id="locationHint"
                {...register('locationHint')}
                placeholder="z.B. Eingang unter der Treppe"
                className={errors.locationHint ? 'border-red-500' : ''}
              />
              {errors.locationHint && (
                <p className="text-sm text-red-500">{errors.locationHint.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
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

            {watchLocationType === 'OTHER' && (
              <div className="space-y-1.5">
                <Label htmlFor="locationId">Standort</Label>
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

            <div className="space-y-1.5">
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
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Studiengänge + Dozierende */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Section 5: Studiengänge */}
        <Card className="border-l-4 border-l-[#9333ea]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Studiengänge</CardTitle>
            <CardDescription className="text-xs">
              Welche Studiengänge werden bei dieser Veranstaltung vorgestellt?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiSelect
              options={studyProgramOptions}
              value={watch('studyProgramIds') || []}
              onChange={(value) => setValue('studyProgramIds', value)}
              placeholder={
                watchIsCrossProgram
                  ? 'Studiengangsübergreifend (alle)'
                  : 'Studiengänge auswählen...'
              }
              searchPlaceholder="Studiengang suchen..."
              emptyText="Keine Studiengänge gefunden"
              disabled={watchIsCrossProgram}
            />
          </CardContent>
        </Card>

        {/* Section 6: Dozierende */}
        <Card className="border-l-4 border-l-[#22c55e]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Dozierende</span>
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
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Dozent hinzufügen
              </Button>
            </CardTitle>
            <CardDescription className="text-xs">
              Wer hält die Veranstaltung oder führt durch das Programm?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lecturerFields.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Dozenten hinzugefügt</p>
            ) : (
              lecturerFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Dozent {index + 1}</span>
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
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
                    <div className="space-y-1.5">
                      <Label>
                        Nachname <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        {...register(`lecturers.${index}.lastName`)}
                        placeholder="Mustermann"
                      />
                      {errors.lecturers?.[index]?.lastName && (
                        <p className="text-sm text-red-500">
                          {errors.lecturers[index].lastName?.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>E-Mail</Label>
                      <Input
                        type="email"
                        {...register(`lecturers.${index}.email`)}
                        placeholder="max.mustermann@uni.de"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Zugehörigkeit</Label>
                      <Select
                        value={watch(`lecturers.${index}.affiliation`) || ''}
                        onValueChange={(value) =>
                          setValue(
                            `lecturers.${index}.affiliation`,
                            value as 'UNI' | 'HOCHSCHULE' | 'EXTERN'
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNI">Universität</SelectItem>
                          <SelectItem value="HOCHSCHULE">Hochschule</SelectItem>
                          <SelectItem value="EXTERN">Extern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Foto & Zusätzliches (full width) */}
      <Card className="border-l-4 border-l-[#f59e0b]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Foto & Zusätzliches</CardTitle>
          <CardDescription className="text-xs">Weitere Details und Medien</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ImageUpload
            value={watch('photoUrl') || ''}
            onChange={(url) => setValue('photoUrl', url)}
          />

          <div className="space-y-1.5">
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
            <p className="text-xs text-gray-500">
              {watch('additionalInfo')?.length || 0}/2000 Zeichen
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Markets (for INFOSTAND type) */}
      {watchEventType === 'INFOSTAND' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Infomärkte</CardTitle>
            <CardDescription className="text-xs">
              An welchen Infomärkten nimmt dieser Stand teil?
            </CardDescription>
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

      {/* Organizers (kept as-is) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
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
              <Plus className="mr-1 h-4 w-4" />
              Ansprechpartner hinzufügen
            </Button>
          </CardTitle>
          <CardDescription className="text-xs">
            Interne Kontaktpersonen für die Organisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {organizerFields.length === 0 ? (
            <p className="text-sm text-gray-500">Keine Ansprechpartner hinzugefügt</p>
          ) : (
            organizerFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Ansprechpartner {index + 1}</span>
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
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
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefon
                    </Label>
                    <Input
                      {...register(`organizers.${index}.phone`)}
                      placeholder="+49 541 123456"
                    />
                  </div>
                  <div className="space-y-1.5 flex items-end">
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

      {/* Submit */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="uni"
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting
            ? 'Speichern...'
            : initialData?.id
              ? 'Veranstaltung aktualisieren'
              : 'Veranstaltung speichern'}
        </Button>
      </div>
    </form>
  )
}

export default EventForm
