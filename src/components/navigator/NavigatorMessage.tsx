'use client'

import { cn } from '@/lib/utils'
import type { NavigatorMessage as NavigatorMessageType } from '@/types/navigator'
import { Bot, User } from 'lucide-react'
import { useMemo } from 'react'

interface NavigatorMessageProps {
  message: NavigatorMessageType
}

/**
 * Clean message content by removing JSON control fields that may leak through
 */
function cleanContent(content: string): string {
  // Remove shouldEndSession patterns at the end
  let cleaned = content.replace(/\n*shouldEndSession:\s*(true|false)\s*$/gi, '')
  // Remove JSON-like control fields
  cleaned = cleaned.replace(/\n*\{?\s*"?shouldEndSession"?\s*:\s*(true|false)\s*}?\s*$/gi, '')
  return cleaned.trim()
}

/**
 * Simple markdown renderer for chat messages
 */
function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let inList = false

  const processInlineMarkdown = (text: string): React.ReactNode => {
    // Bold: **text** or __text__
    const parts: React.ReactNode[] = []
    let remaining = text
    let key = 0

    while (remaining.length > 0) {
      // Check for bold
      const boldMatch = remaining.match(/\*\*(.+?)\*\*|__(.+?)__/)
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.substring(0, boldMatch.index))
        }
        parts.push(<strong key={key++}>{boldMatch[1] || boldMatch[2]}</strong>)
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length)
        continue
      }

      // Check for italic
      const italicMatch = remaining.match(/\*(.+?)\*|_([^_]+)_/)
      if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push(remaining.substring(0, italicMatch.index))
        }
        parts.push(<em key={key++}>{italicMatch[1] || italicMatch[2]}</em>)
        remaining = remaining.substring(italicMatch.index + italicMatch[0].length)
        continue
      }

      // Check for inline code
      const codeMatch = remaining.match(/`([^`]+)`/)
      if (codeMatch && codeMatch.index !== undefined) {
        if (codeMatch.index > 0) {
          parts.push(remaining.substring(0, codeMatch.index))
        }
        parts.push(
          <code key={key++} className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-sm">
            {codeMatch[1]}
          </code>
        )
        remaining = remaining.substring(codeMatch.index + codeMatch[0].length)
        continue
      }

      // No more matches, add remaining text
      parts.push(remaining)
      break
    }

    return parts.length === 1 ? parts[0] : parts
  }

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="list-disc list-inside my-2 space-y-1">
          {listItems.map((item, i) => (
            <li key={i}>{processInlineMarkdown(item)}</li>
          ))}
        </ul>
      )
      listItems = []
    }
    inList = false
  }

  lines.forEach((line, index) => {
    // List item
    if (line.match(/^[-*]\s+/)) {
      inList = true
      listItems.push(line.replace(/^[-*]\s+/, ''))
      return
    }

    // Not a list item - flush any pending list
    if (inList) {
      flushList()
    }

    // Heading (# Header)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2]
      if (level === 1) {
        elements.push(
          <h3 key={index} className="text-lg font-bold mt-2">
            {processInlineMarkdown(text)}
          </h3>
        )
      } else if (level === 2) {
        elements.push(
          <h4 key={index} className="text-base font-semibold mt-2">
            {processInlineMarkdown(text)}
          </h4>
        )
      } else {
        elements.push(
          <h5 key={index} className="font-medium mt-1">
            {processInlineMarkdown(text)}
          </h5>
        )
      }
      return
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<br key={index} />)
      return
    }

    // Regular paragraph
    elements.push(
      <p key={index} className="mb-1">
        {processInlineMarkdown(line)}
      </p>
    )
  })

  // Flush any remaining list items
  if (inList) {
    flushList()
  }

  return elements
}

export function NavigatorMessage({ message }: NavigatorMessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  const cleanedContent = useMemo(() => cleanContent(message.content), [message.content])

  if (isSystem) {
    return <div className="text-center text-sm text-muted-foreground py-2">{cleanedContent}</div>
  }

  return (
    <div className={cn('flex gap-3 py-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{cleanedContent}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {renderMarkdown(cleanedContent)}
          </div>
        )}

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
