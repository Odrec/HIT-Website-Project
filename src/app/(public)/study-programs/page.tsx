'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Search, Building2, Filter, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface Cluster {
  id: string
  name: string
  description: string | null
}

interface StudyProgram {
  id: string
  name: string
  institution: 'UNI' | 'HOCHSCHULE' | 'BOTH'
  clusterId: string | null
  cluster: Cluster | null
}

const institutionLabels: Record<string, string> = {
  UNI: 'Universität',
  HOCHSCHULE: 'Hochschule',
  BOTH: 'Beide Hochschulen',
}

const institutionColors: Record<string, string> = {
  UNI: 'bg-hit-uni-100 text-hit-uni-800 border-hit-uni-200',
  HOCHSCHULE: 'bg-hit-hs-100 text-hit-hs-800 border-hit-hs-200',
  BOTH: 'bg-purple-100 text-purple-800 border-purple-200',
}

export default function StudyProgramsPage() {
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [institutionFilter, setInstitutionFilter] = useState<string>('all')

  useEffect(() => {
    fetchStudyPrograms()
  }, [])

  const fetchStudyPrograms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/study-programs')
      if (response.ok) {
        const data = await response.json()
        setStudyPrograms(data)
      }
    } catch (error) {
      console.error('Error fetching study programs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter programs based on search and institution
  const filteredPrograms = studyPrograms.filter((program) => {
    const matchesSearch =
      program.name.toLowerCase().includes(search.toLowerCase()) ||
      program.cluster?.name.toLowerCase().includes(search.toLowerCase())
    const matchesInstitution =
      institutionFilter === 'all' || program.institution === institutionFilter
    return matchesSearch && matchesInstitution
  })

  // Group programs by cluster
  const groupedPrograms = filteredPrograms.reduce(
    (acc, program) => {
      const clusterName = program.cluster?.name || 'Weitere Studiengänge'
      if (!acc[clusterName]) {
        acc[clusterName] = []
      }
      acc[clusterName].push(program)
      return acc
    },
    {} as Record<string, StudyProgram[]>
  )

  // Sort cluster names alphabetically, but put "Weitere Studiengänge" at the end
  const sortedClusterNames = Object.keys(groupedPrograms).sort((a, b) => {
    if (a === 'Weitere Studiengänge') return 1
    if (b === 'Weitere Studiengänge') return -1
    return a.localeCompare(b, 'de')
  })

  // Count by institution
  const uniCount = studyPrograms.filter(
    (p) => p.institution === 'UNI' || p.institution === 'BOTH'
  ).length
  const hsCount = studyPrograms.filter(
    (p) => p.institution === 'HOCHSCHULE' || p.institution === 'BOTH'
  ).length

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-green-600 to-green-500 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="h-10 w-10" />
            <h1 className="text-3xl font-bold lg:text-4xl">Studiengänge</h1>
          </div>
          <p className="text-lg text-white/90 max-w-2xl">
            Entdecken Sie über 200 Studiengänge an der Universität und Hochschule Osnabrück. Finden
            Sie den passenden Studiengang für Ihre Zukunft.
          </p>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap gap-4">
            <div className="rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="font-semibold">{uniCount}</span> Uni-Studiengänge
            </div>
            <div className="rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="font-semibold">{hsCount}</span> HS-Studiengänge
            </div>
            <div className="rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="font-semibold">{Object.keys(groupedPrograms).length}</span>{' '}
              Fachbereiche
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Studiengang oder Fachbereich suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Alle Hochschulen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Hochschulen</SelectItem>
                  <SelectItem value="UNI">Universität</SelectItem>
                  <SelectItem value="HOCHSCHULE">Hochschule</SelectItem>
                  <SelectItem value="BOTH">Beide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="flex-1 bg-hit-gray-50 py-8">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((j) => (
                        <Skeleton key={j} className="h-10 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPrograms.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent>
                <GraduationCap className="mx-auto h-12 w-12 text-hit-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-hit-gray-900">
                  Keine Studiengänge gefunden
                </h3>
                <p className="mt-2 text-hit-gray-600">
                  {search || institutionFilter !== 'all'
                    ? 'Versuchen Sie es mit anderen Suchkriterien.'
                    : 'Es wurden noch keine Studiengänge hinzugefügt.'}
                </p>
                {(search || institutionFilter !== 'all') && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearch('')
                      setInstitutionFilter('all')
                    }}
                  >
                    Filter zurücksetzen
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedClusterNames.map((clusterName) => (
                <Card key={clusterName}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-xl">{clusterName}</CardTitle>
                    </div>
                    <CardDescription>
                      {groupedPrograms[clusterName].length} Studiengang
                      {groupedPrograms[clusterName].length !== 1 ? 'e' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {groupedPrograms[clusterName]
                        .sort((a, b) => a.name.localeCompare(b.name, 'de'))
                        .map((program) => (
                          <Link
                            key={program.id}
                            href={`/events?studyProgram=${program.id}`}
                            className="group"
                          >
                            <div className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-md hover:border-green-300 transition-all">
                              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="flex-1 text-sm font-medium group-hover:text-green-700">
                                {program.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${institutionColors[program.institution]}`}
                              >
                                {program.institution === 'UNI'
                                  ? 'Uni'
                                  : program.institution === 'HOCHSCHULE'
                                    ? 'HS'
                                    : 'Beide'}
                              </Badge>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Navigator CTA */}
      <section className="bg-gradient-to-r from-hit-uni-600 to-hit-hs-500 py-8 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl font-bold lg:text-2xl">Noch unsicher, welcher Studiengang passt?</h2>
          <p className="mt-2 text-white/90">
            Unser KI-gestützter Studiennavigator hilft Ihnen, den richtigen Studiengang zu finden.
          </p>
          <Link href="/navigator" className="inline-block mt-4">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-hit-uni-700 hover:bg-white/90"
            >
              Zum Studiennavigator
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
