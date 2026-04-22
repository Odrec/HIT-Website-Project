'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Affiliation } from '@/types/events'
import { affiliationLabels } from '@/lib/validations/melder'

interface MelderUser {
  id: string
  email: string | null
  name: string | null
  role: string
}

interface Melder {
  id: string
  firstName: string
  lastName: string
  title: string | null
  email: string
  phone: string | null
  affiliation: Affiliation
  fakultaet: string | null
  fachbereich: string | null
  room: string | null
  createdAt: string
  updatedAt: string
  user: MelderUser
  _count: { events: number }
}

const affiliationVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  UNI: 'default',
  HOCHSCHULE: 'secondary',
  BEIDE: 'secondary',
  EXTERN: 'outline',
}

export default function MeldersPage() {
  const [melders, setMelders] = useState<Melder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMelders = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/melder/all')
      if (response.ok) {
        const data = await response.json()
        setMelders(data)
      }
    } catch (error) {
      console.error('Failed to fetch melders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMelders()
  }, [fetchMelders])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Melder</h1>
        <p className="text-muted-foreground">Übersicht aller registrierten Melder</p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : melders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Noch keine Melder vorhanden
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: Table layout */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Melder ({melders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Zugehörigkeit</TableHead>
                      <TableHead>Fakultät</TableHead>
                      <TableHead>Fachbereich</TableHead>
                      <TableHead>Veranstaltungen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {melders.map((melder) => (
                      <TableRow key={melder.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{[melder.firstName, melder.lastName].filter(Boolean).join(' ')}</p>
                            {melder.title && (
                              <p className="text-xs text-muted-foreground">{melder.title}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{melder.email}</TableCell>
                        <TableCell>
                          <Badge variant={affiliationVariants[melder.affiliation] ?? 'outline'}>
                            {affiliationLabels[melder.affiliation] ?? melder.affiliation}
                          </Badge>
                        </TableCell>
                        <TableCell>{melder.fakultaet || '-'}</TableCell>
                        <TableCell>{melder.fachbereich || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{melder._count.events}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile: Card layout */}
          <div className="space-y-4 md:hidden">
            {melders.map((melder) => (
              <Card key={melder.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base">
                        {[melder.firstName, melder.lastName].filter(Boolean).join(' ')}
                      </CardTitle>
                      {melder.title && (
                        <p className="text-xs text-muted-foreground mt-0.5">{melder.title}</p>
                      )}
                    </div>
                    <Badge
                      variant={affiliationVariants[melder.affiliation] ?? 'outline'}
                      className="shrink-0"
                    >
                      {affiliationLabels[melder.affiliation] ?? melder.affiliation}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{melder.email}</p>
                  {melder.fakultaet && (
                    <p>
                      <span className="font-medium">Fakultät: </span>
                      {melder.fakultaet}
                    </p>
                  )}
                  {melder.fachbereich && (
                    <p>
                      <span className="font-medium">Fachbereich: </span>
                      {melder.fachbereich}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-muted-foreground">Veranstaltungen:</span>
                    <Badge variant="secondary">{melder._count.events}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
