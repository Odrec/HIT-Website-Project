'use client'

import { Suspense } from 'react'
import { Sparkles, Info } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RecommendationList, ScheduleAnalysis } from '@/components/recommendations'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function RecommendationsPageContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-yellow-500" />
          Empfehlungen für dich
        </h1>
        <p className="text-muted-foreground mt-2">
          Personalisierte Veranstaltungsempfehlungen basierend auf deinem Stundenplan und deinen
          Interessen
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recommendations">
            <Sparkles className="h-4 w-4 mr-2" />
            Empfehlungen
          </TabsTrigger>
          <TabsTrigger value="analysis">Stundenplan-Analyse</TabsTrigger>
          <TabsTrigger value="info">
            <Info className="h-4 w-4 mr-2" />
            So funktioniert&apos;s
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations">
          <RecommendationList showFilters={true} showGroups={true} limit={24} />
        </TabsContent>

        <TabsContent value="analysis">
          <ScheduleAnalysis />
        </TabsContent>

        <TabsContent value="info">
          <div className="space-y-6 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Wie werden Empfehlungen berechnet?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Unsere Empfehlungen basieren auf einem Punktesystem (0–100), das verschiedene
                  Faktoren berücksichtigt. Je höher die Punktzahl, desto besser passt eine
                  Veranstaltung zu deinem Profil.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bewertungsfaktoren</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <span className="font-semibold text-green-700 min-w-[60px]">40 Pkt.</span>
                    <div>
                      <p className="font-medium text-foreground">Studiengang-Übereinstimmung</p>
                      <p className="text-sm text-muted-foreground">
                        Veranstaltungen, die zu deinen ausgewählten Studiengängen passen, erhalten
                        die höchste Bewertung (bis zu 20 Punkte pro übereinstimmendem Studiengang).
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="font-semibold text-green-700 min-w-[60px]">15 Pkt.</span>
                    <div>
                      <p className="font-medium text-foreground">Bevorzugter Veranstaltungstyp</p>
                      <p className="text-sm text-muted-foreground">
                        Wenn du z.B. Vorlesungen oder Workshops bevorzugst, werden passende
                        Veranstaltungen höher bewertet.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="font-semibold text-green-700 min-w-[60px]">15 Pkt.</span>
                    <div>
                      <p className="font-medium text-foreground">Zeitliche Verfügbarkeit</p>
                      <p className="text-sm text-muted-foreground">
                        Veranstaltungen, die in deine freien Zeitfenster passen, werden bevorzugt.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="font-semibold text-green-700 min-w-[60px]">10 Pkt.</span>
                    <div>
                      <p className="font-medium text-foreground">Keine Überschneidung</p>
                      <p className="text-sm text-muted-foreground">
                        Veranstaltungen ohne zeitliche Konflikte mit deinem bestehenden Stundenplan
                        erhalten Bonuspunkte.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="font-semibold text-green-700 min-w-[60px]">10 Pkt.</span>
                    <div>
                      <p className="font-medium text-foreground">Beliebtheit</p>
                      <p className="text-sm text-muted-foreground">
                        Veranstaltungen, die von vielen anderen Besuchern angesehen oder in
                        Zeitpläne aufgenommen wurden, werden leicht bevorzugt.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="font-semibold text-green-700 min-w-[60px]">5 Pkt.</span>
                    <div>
                      <p className="font-medium text-foreground">Vielfalt</p>
                      <p className="text-sm text-muted-foreground">
                        Veranstaltungstypen, die noch nicht in deinem Stundenplan vertreten sind,
                        erhalten einen kleinen Bonus für mehr Abwechslung.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="font-semibold text-green-700 min-w-[60px]">5 Pkt.</span>
                    <div>
                      <p className="font-medium text-foreground">Kurzer Fußweg</p>
                      <p className="text-sm text-muted-foreground">
                        Wenn die Veranstaltung nah an deinem vorherigen Termin liegt und der Fußweg
                        kurz genug ist, gibt es Bonuspunkte.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="font-semibold text-red-600 min-w-[60px]">−5 Pkt.</span>
                    <div>
                      <p className="font-medium text-foreground">Bereits angesehen</p>
                      <p className="text-sm text-muted-foreground">
                        Veranstaltungen, die du bereits besucht hast, werden leicht herabgestuft,
                        damit neue Inhalte sichtbarer werden.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gruppierung</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  Die Empfehlungen werden nach Studiengängen und Veranstaltungstypen gruppiert
                  angezeigt, damit du schnell die für dich relevanten Bereiche findest.
                </p>
                <p>
                  Die Stundenplan-Analyse zeigt dir außerdem Lücken, Konflikte und
                  Optimierungsvorschläge für deinen bestehenden Stundenplan.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Datenschutz</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Deine Interessen und dein Stundenplan werden nur lokal in deinem Browser gespeichert.
                  Es werden keine persönlichen Daten an den Server übermittelt — die Empfehlungen
                  werden anhand anonymer Kriterien berechnet.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function RecommendationsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      }
    >
      <RecommendationsPageContent />
    </Suspense>
  )
}
