'use client'

import { cn } from '@/lib/utils'
import type { NavigatorMessage as NavigatorMessageType } from '@/types/navigator'
import { Bot, User } from 'lucide-react'

interface NavigatorMessageProps {
  message: NavigatorMessageType
}

export function NavigatorMessage({ message }: NavigatorMessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="text-center text-sm text-muted-foreground py-2">
        {message.content}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex gap-3 py-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
      
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        <div className="text-xs opacity-70 mt-1">
          {new Date(message.timestamp).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-5 h-5 text-secondary-foreground" />
        </div>
      )}
    </div>
  )
}

export default NavigatorMessage
