'use client'

import { useRouter } from 'next/navigation'
import { NavigatorChat } from '@/components/navigator'

export default function NavigatorPage() {
  const router = useRouter()

  const handleProgramSelect = (programId: string) => {
    // Navigate to events filtered by this program
    router.push(`/events?studyProgramId=${programId}`)
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Studiennavigator</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Finde den passenden Studiengang für dich! Unser KI-gestützter Navigator hilft dir dabei,
          basierend auf deinen Interessen und Zielen die besten Studiengänge zu entdecken.
        </p>
      </div>

      <NavigatorChat onProgramSelect={handleProgramSelect} />
    </div>
  )
}
