'use client'

import { useState, useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

interface FilterState {
  eventType: string
  institution: string
  studyProgramId: string
  timeFrom: string
  timeTo: string
}

interface EventFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onClear: () => void
}

interface StudyProgram {
  id: string
  name: string
  institution: string
  clusters?: {
    id: string
    name: string
  }[]
}

const eventTypes = [
  { value: 'VORTRAG', label: 'Vortrag' },
  { value: 'LABORFUEHRUNG', label: 'Laborführung' },
  { value: 'RUNDGANG', label: 'Rundgang' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'INFOSTAND', label: 'Infostand' },
]

const institutions = [
  { value: 'UNI', label: 'Universität Osnabrück' },
  { value: 'HS', label: 'Hochschule Osnabrück' },
  { value: 'BOTH', label: 'Beide Institutionen' },
]

/**
 * Filter component for public event browsing
 */
export function EventFilters({ filters, onChange, onClear }: EventFiltersProps) {
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)

  // Fetch study programs
  useEffect(() => {
    const fetchStudyPrograms = async () => {
      try {
        const response = await fetch('/api/study-programs')
        if (response.ok) {
          const data = await response.json()
          setStudyPrograms(data)
        }
      } catch (error) {
        console.error('Error fetching study programs:', error)
      } finally {
        setLoadingPrograms(false)
      }
    }
    fetchStudyPrograms()
  }, [])

  // Filter study programs based on selected institution
  // Map frontend value (HS) to Prisma enum (HOCHSCHULE) for comparison
  const mapInstitutionToEnum = (inst: string): string => {
    if (inst === 'HS') return 'HOCHSCHULE'
    return inst
  }

  const filteredStudyPrograms = studyPrograms.filter((sp) => {
    if (!filters.institution || filters.institution === 'BOTH') return true
    const mappedInstitution = mapInstitutionToEnum(filters.institution)
    return sp.institution === mappedInstitution || sp.institution === 'BOTH'
  })

  // Group study programs by Studienfeld. A program assigned to multiple
  // Studienfeldern appears in each group (stakeholder requirement).
  const groupedPrograms = filteredStudyPrograms.reduce<Record<string, StudyProgram[]>>(
    (acc, program) => {
      const clusterNames =
        program.clusters && program.clusters.length > 0
          ? program.clusters.map((c) => c.name)
          : ['Sonstige']
      for (const clusterName of clusterNames) {
        if (!acc[clusterName]) acc[clusterName] = []
        acc[clusterName].push(program)
      }
      return acc
    },
    {}
  )

  const handleChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }

    // Clear study program if institution changes and the selected program doesn't match
    if (key === 'institution' && filters.studyProgramId) {
      const selectedProgram = studyPrograms.find((sp) => sp.id === filters.studyProgramId)
      if (selectedProgram && value !== 'BOTH') {
        const mappedValue = mapInstitutionToEnum(value)
        if (selectedProgram.institution !== mappedValue && selectedProgram.institution !== 'BOTH') {
          newFilters.studyProgramId = ''
        }
      }
    }

    if (value) {
      trackEvent('filter', key, value)
    }
    onChange(newFilters)
  }

  const hasFilters = Object.values(filters).some((v) => v)

  // Count active filters for the badge
  const activeFilterCount = Object.values(filters).filter((v) => v).length

  return (
    <Card className={hasFilters ? 'border-hit-uni-300 bg-hit-uni-50/30' : ''}>
      <CardContent className="pt-6">
        {/* Active filters summary */}
        {hasFilters && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-hit-gray-700">
              {activeFilterCount} Filter aktiv:
            </span>
            {filters.eventType && (
              <span className="inline-flex items-center gap-1 rounded-full bg-hit-uni-100 px-2.5 py-0.5 text-xs font-medium text-hit-uni-700">
                {eventTypes.find((t) => t.value === filters.eventType)?.label}
                <button
                  onClick={() => handleChange('eventType', '')}
                  className="ml-0.5 hover:text-hit-uni-900"
                  aria-label="Filter entfernen"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.institution && (
              <span className="inline-flex items-center gap-1 rounded-full bg-hit-uni-100 px-2.5 py-0.5 text-xs font-medium text-hit-uni-700">
                {institutions.find((i) => i.value === filters.institution)?.label}
                <button
                  onClick={() => handleChange('institution', '')}
                  className="ml-0.5 hover:text-hit-uni-900"
                  aria-label="Filter entfernen"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.studyProgramId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-hit-uni-100 px-2.5 py-0.5 text-xs font-medium text-hit-uni-700">
                {studyPrograms.find((sp) => sp.id === filters.studyProgramId)?.name ||
                  'Studiengang'}
                <button
                  onClick={() => handleChange('studyProgramId', '')}
                  className="ml-0.5 hover:text-hit-uni-900"
                  aria-label="Filter entfernen"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.timeFrom && (
              <span className="inline-flex items-center gap-1 rounded-full bg-hit-uni-100 px-2.5 py-0.5 text-xs font-medium text-hit-uni-700">
                Ab {filters.timeFrom}
                <button
                  onClick={() => handleChange('timeFrom', '')}
                  className="ml-0.5 hover:text-hit-uni-900"
                  aria-label="Filter entfernen"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.timeTo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-hit-uni-100 px-2.5 py-0.5 text-xs font-medium text-hit-uni-700">
                Bis {filters.timeTo}
                <button
                  onClick={() => handleChange('timeTo', '')}
                  className="ml-0.5 hover:text-hit-uni-900"
                  aria-label="Filter entfernen"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto h-7 text-xs">
              <X className="mr-1 h-3 w-3" />
              Alle zurücksetzen
            </Button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="eventType">Veranstaltungsart</Label>
            <Select
              value={filters.eventType || 'all'}
              onValueChange={(value) => handleChange('eventType', value === 'all' ? '' : value)}
            >
              <SelectTrigger
                id="eventType"
                className={filters.eventType ? 'border-hit-uni-400' : ''}
              >
                <SelectValue placeholder="Alle Arten" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Arten</SelectItem>
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Institution */}
          <div className="space-y-2">
            <Label htmlFor="institution">Institution</Label>
            <Select
              value={filters.institution || 'all'}
              onValueChange={(value) => handleChange('institution', value === 'all' ? '' : value)}
            >
              <SelectTrigger
                id="institution"
                className={filters.institution ? 'border-hit-uni-400' : ''}
              >
                <SelectValue placeholder="Alle Institutionen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Institutionen</SelectItem>
                {institutions.map((inst) => (
                  <SelectItem key={inst.value} value={inst.value}>
                    {inst.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Study Program */}
          <div className="space-y-2">
            <Label htmlFor="studyProgram">Studiengang</Label>
            <Select
              value={filters.studyProgramId || 'all'}
              onValueChange={(value) =>
                handleChange('studyProgramId', value === 'all' ? '' : value)
              }
              disabled={loadingPrograms}
            >
              <SelectTrigger
                id="studyProgram"
                className={filters.studyProgramId ? 'border-hit-uni-400' : ''}
              >
                <SelectValue placeholder={loadingPrograms ? 'Laden...' : 'Alle Studiengänge'} />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="all">Alle Studiengänge</SelectItem>
                {filteredStudyPrograms.length === 0 && !loadingPrograms ? (
                  <div className="px-2 py-3 text-center text-sm text-hit-gray-500">
                    Keine Studiengänge für diese Institution gefunden.
                  </div>
                ) : (
                  Object.entries(groupedPrograms).map(([clusterName, programs]) => (
                    <div key={clusterName}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-hit-gray-500">
                        {clusterName}
                      </div>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Time From */}
          <div className="space-y-2">
            <Label htmlFor="timeFrom">Von (Uhrzeit)</Label>
            <Input
              id="timeFrom"
              type="time"
              value={filters.timeFrom}
              onChange={(e) => handleChange('timeFrom', e.target.value)}
              className={filters.timeFrom ? 'border-hit-uni-400' : ''}
            />
          </div>

          {/* Time To */}
          <div className="space-y-2">
            <Label htmlFor="timeTo">Bis (Uhrzeit)</Label>
            <Input
              id="timeTo"
              type="time"
              value={filters.timeTo}
              onChange={(e) => handleChange('timeTo', e.target.value)}
              className={filters.timeTo ? 'border-hit-uni-400' : ''}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
