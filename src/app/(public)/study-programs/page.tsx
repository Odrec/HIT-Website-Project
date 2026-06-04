'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Search, Building2, Filter, ExternalLink, HelpCircle } from 'lucide-react'
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
  links: Array<{ label: string; url: string }>
  clusters: Cluster[]
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
    const needle = search.toLowerCase()
    const matchesSearch =
      program.name.toLowerCase().includes(needle) ||
      program.clusters.some((c) => c.name.toLowerCase().includes(needle))
    const matchesInstitution =
      institutionFilter === 'all' || program.institution === institutionFilter
    return matchesSearch && matchesInstitution
  })

  // Group programs by Studienfeld — a program assigned to multiple fields
  // appears in each group (stakeholder requirement).
  const groupedPrograms = filteredPrograms.reduce(
    (acc, program) => {
      const entries =
        program.clusters.length > 0 ? program.clusters.map((c) => c.name) : ['Weitere Studiengänge']
      for (const name of entries) {
        if (!acc[name]) {
          acc[name] = { programs: [] }
        }
        acc[name].programs.push(program)
      }
      return acc
    },
    {} as Record<string, { programs: StudyProgram[] }>
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
            <Link
              href="/hilfe/besucher#studiengaenge"
              className="inline-flex items-center gap-1.5 rounded-md bg-white/20 px-2.5 py-1 text-xs text-white/90 transition-colors hover:bg-white/30"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Hilfe</span>
            </Link>
          </div>
          <p className="text-lg text-white/90 max-w-2xl">
            Entdecken Sie über 200 Studiengänge an der Universität und Hochschule Osnabrück. Finden
            Sie den passenden Studiengang für Ihre Zukunft.
          </p>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap gap-4">
            <div className="rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="font-semibold">{uniCount}</span> Studiengänge der Universität
            </div>
            <div className="rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="font-semibold">{hsCount}</span> Studiengänge der Hochschule
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
                    <CardTitle className="text-xl">{clusterName}</CardTitle>
                    <CardDescription>
                      {groupedPrograms[clusterName].programs.length} Studiengang
                      {groupedPrograms[clusterName].programs.length !== 1 ? 'e' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {groupedPrograms[clusterName].programs
                        .sort((a, b) => a.name.localeCompare(b.name, 'de'))
                        .map((program) => (
                          <div
                            key={program.id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-md hover:border-green-300 transition-all"
                          >
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Link
                              href={`/events/program/${program.id}`}
                              className="flex-1 text-sm font-medium hover:text-green-700"
                            >
                              {program.name}
                            </Link>
                            {program.links.length > 0 && (
                              <div className="flex flex-shrink-0 items-center gap-1.5">
                                {program.links.map((link) => (
                                  <a
                                    key={link.url}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-green-700"
                                    aria-label={`${link.label} – ${program.name}`}
                                    title={link.label}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                ))}
                              </div>
                            )}
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
          <h2 className="text-xl font-bold lg:text-2xl">
            Noch unsicher, welcher Studiengang passt?
          </h2>
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
