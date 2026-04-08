'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface ExportCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
}

export function ExportCard({ title, description, icon: Icon, href }: ExportCardProps) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      const response = await fetch(href)
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || `Download fehlgeschlagen (${response.status})`)
      }
      const disposition = response.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="(.+)"/)
      const filename = match?.[1] || 'export'
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download fehlgeschlagen')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-hit-gray-100 p-2">
            <Icon className="h-5 w-5 text-hit-gray-600" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {downloading ? 'Wird erstellt...' : 'Herunterladen'}
        </Button>
      </CardContent>
    </Card>
  )
}
