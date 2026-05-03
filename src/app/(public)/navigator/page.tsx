'use client'

import { useRouter } from 'next/navigation'
import { NavigatorChat } from '@/components/navigator'
import { HelpLink } from '@/components/help/HelpLink'

export default function NavigatorPage() {
  const router = useRouter()

  const handleProgramSelect = (programId: string) => {
    router.push(`/events/program/${programId}`)
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Studiennavigator</h1>
          <HelpLink href="/hilfe/besucher#studiengangs-navigator" />
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Finde den passenden Studiengang für dich! Unser KI-gestützter Navigator hilft dir dabei,
          basierend auf deinen Interessen und Zielen die besten Studiengänge zu entdecken.
        </p>
      </div>

      <NavigatorChat onProgramSelect={handleProgramSelect} />
    </div>
  )
}
