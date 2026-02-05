'use client'

import { AlertTriangle, Phone, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { SupportResource } from '@/types/navigator'

interface CrisisSupportBannerProps {
  resources: SupportResource[]
  severity?: 'low' | 'medium' | 'high'
}

export function CrisisSupportBanner({ resources, severity = 'medium' }: CrisisSupportBannerProps) {
  return (
    <Card
      className={`border-2 ${severity === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-950' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle
            className={`w-5 h-5 ${severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`}
          />
          <span>Hilfe & Unterstützung</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Es tut uns leid zu hören, dass du gerade schwierige Zeiten durchmachst. Du bist nicht
          allein - diese Ressourcen können dir helfen:
        </p>

        <div className="space-y-3">
          {resources.map((resource, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">{resource.name}</h4>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Erreichbar: {resource.available}
                </p>
              </div>

              <div className="flex gap-2">
                {resource.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${resource.phone.replace(/\s/g, '')}`}>
                      <Phone className="w-4 h-4 mr-1" />
                      {resource.phone}
                    </a>
                  </Button>
                )}

                {resource.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Website
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default CrisisSupportBanner
