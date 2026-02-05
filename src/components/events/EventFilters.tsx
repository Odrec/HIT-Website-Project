'use client'

import { useState, useEffect } from 'react'
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
  cluster?: {
    id: string
    name: string
  }
}

const eventTypes = [
  { value: 'VORTRAG', label: 'Vortrag' },
  { value: 'LABORFUEHRUNG', label: 'Laborführung' },
  { value: 'RUNDGANG', label: 'Rundgang' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'LINK', label: 'Online-Link' },
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
  const filteredStudyPrograms = studyPrograms.filter((sp) => {
    if (!filters.institution || filters.institution === 'BOTH') return true
    return sp.institution === filters.institution
  })

  // Group study programs by cluster
  const groupedPrograms = filteredStudyPrograms.reduce<Record<string, StudyProgram[]>>(
    (acc, program) => {
      const clusterName = program.cluster?.name || 'Sonstige'
      if (!acc[clusterName]) {
        acc[clusterName] = []
      }
      acc[clusterName].push(program)
      return acc
    },
    {}
  )

  const handleChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }

    // Clear study program if institution changes and the selected program doesn't match
    if (key === 'institution' && filters.studyProgramId) {
      const selectedProgram = studyPrograms.find((sp) => sp.id === filters.studyProgramId)
      if (selectedProgram && value !== 'BOTH' && selectedProgram.institution !== value) {
        newFilters.studyProgramId = ''
      }
    }

    onChange(newFilters)
  }

  const hasFilters = Object.values(filters).some((v) => v)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="eventType">Veranstaltungsart</Label>
            <Select
              value={filters.eventType || 'all'}
              onValueChange={(value) => handleChange('eventType', value === 'all' ? '' : value)}
            >
              <SelectTrigger id="eventType">
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
              <SelectTrigger id="institution">
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
              <SelectTrigger id="studyProgram">
                <SelectValue placeholder={loadingPrograms ? 'Laden...' : 'Alle Studiengänge'} />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="all">Alle Studiengänge</SelectItem>
                {Object.entries(groupedPrograms).map(([clusterName, programs]) => (
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
                ))}
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
            />
          </div>
        </div>

        {/* Clear Button */}
        {hasFilters && (
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X className="mr-2 h-4 w-4" />
              Alle Filter zurücksetzen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
