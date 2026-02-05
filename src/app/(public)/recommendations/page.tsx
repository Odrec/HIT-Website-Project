'use client'

import { Suspense } from 'react'
import { Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
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
          Personalisierte Veranstaltungsempfehlungen basierend auf deinem Zeitplan und deinen
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
          <TabsTrigger value="analysis">Zeitplan-Analyse</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations">
          <RecommendationList showFilters={true} showGroups={true} limit={24} />
        </TabsContent>

        <TabsContent value="analysis">
          <ScheduleAnalysis />
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
