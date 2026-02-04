'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  MessageCircle,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  BookOpen,
  FileText,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react'
import type { EndSessionResource, ResourceType } from '@/types/navigator'

interface EndSessionResourcesProps {
  resources: EndSessionResource[]
}

const iconMap: Record<string, LucideIcon> = {
  MessageCircle,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  BookOpen,
  FileText,
}

const getIcon = (iconName?: string): LucideIcon => {
  if (!iconName) return BookOpen
  return iconMap[iconName] || BookOpen
}

const getResourceColor = (type: ResourceType): string => {
  switch (type) {
    case 'counseling':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    case 'trial':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    case 'events':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    case 'aptitude_test':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
    case 'information':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    case 'application':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

export function EndSessionResources({ resources }: EndSessionResourcesProps) {
  if (!resources || resources.length === 0) {
    return null
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Nächste Schritte
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Hier findest du weitere hilfreiche Ressourcen für deine Studienentscheidung:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {resources.map((resource, index) => {
            const Icon = getIcon(resource.icon)
            const isInternal = resource.url?.startsWith('/')
            const colorClass = getResourceColor(resource.type)
            
            const content = (
              <div className={`flex items-start gap-3 p-3 rounded-lg transition-all hover:shadow-md ${colorClass}`}>
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm flex items-center gap-1">
                    {resource.title}
                    {resource.url && !isInternal && (
                      <ExternalLink className="w-3 h-3" />
                    )}
                  </h4>
                  <p className="text-xs opacity-80 line-clamp-2">
                    {resource.description}
                  </p>
                </div>
              </div>
            )
            
            if (resource.url) {
              if (isInternal) {
                return (
                  <Link key={index} href={resource.url}>
                    {content}
                  </Link>
                )
              }
              
              return (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {content}
                </a>
              )
            }
            
            return <div key={index}>{content}</div>
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default EndSessionResources
