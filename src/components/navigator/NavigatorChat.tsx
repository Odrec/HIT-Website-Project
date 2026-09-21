'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Send, RotateCcw, Compass } from 'lucide-react'
import { NavigatorMessage } from './NavigatorMessage'
import { NavigatorSuggestions } from './NavigatorSuggestions'
import { NavigatorRecommendations } from './NavigatorRecommendations'
import { CrisisSupportBanner } from './CrisisSupportBanner'
import { EndSessionResources } from './EndSessionResources'
import type {
  NavigatorMessage as NavigatorMessageType,
  NavigatorRecommendation,
  NavigatorOption,
  CrisisDetection,
} from '@/types/navigator'
import { END_SESSION_RESOURCES } from '@/types/navigator'
import { useToast } from '@/hooks/use-toast'

interface NavigatorChatProps {
  onProgramSelect?: (programId: string) => void
  className?: string
}

export function NavigatorChat({ onProgramSelect, className }: NavigatorChatProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<NavigatorMessageType[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState<NavigatorOption[]>([])
  const [recommendation, setRecommendation] = useState<NavigatorRecommendation | null>(null)
  const [crisisDetected, setCrisisDetected] = useState<CrisisDetection | null>(null)
  const [modelName, setModelName] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initializingRef = useRef(false)
  const { toast } = useToast()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize session (with ref guard to prevent duplicate calls in StrictMode).
  // The ref must be reset in the finally block so a Neu-starten click can
  // initialize a fresh session — otherwise the second call early-returns and
  // the user is left with an empty chat focused on the input field.
  const initializeSession = useCallback(async () => {
    if (initializingRef.current || sessionId) return
    initializingRef.current = true

    setIsLoading(true)
    try {
      const response = await fetch('/api/navigator')
      if (!response.ok) throw new Error('Failed to initialize')

      const data = await response.json()
      setSessionId(data.sessionId)

      // Set the model name if provided
      if (data.model) {
        setModelName(data.model)
      }

      const initialMessage: NavigatorMessageType = {
        id: data.message.id,
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(data.message.timestamp),
        metadata: data.message.metadata,
      }

      setMessages([initialMessage])
      setOptions(data.message.metadata?.options || [])
    } catch (error) {
      console.error('Failed to initialize navigator:', error)
      toast({
        title: 'Fehler',
        description: 'Navigator konnte nicht initialisiert werden.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      initializingRef.current = false
    }
  }, [sessionId, toast])

  // Initialize on mount
  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  // Send message
  const sendMessage = async (message: string) => {
    if (!message.trim() || !sessionId || isLoading) return

    const userMessage: NavigatorMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setOptions([])
    setIsLoading(true)

    try {
      const response = await fetch('/api/navigator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message }),
      })

      if (response.status === 503) {
        setMessages((prev) => [
          ...prev,
          {
            id: `unavailable-${Date.now()}`,
            role: 'assistant',
            content:
              'Der Studiennavigator ist gerade nicht erreichbar. Versuch es gleich noch einmal oder schau dir in der Zwischenzeit die [Studienfelder](/events) an.',
            timestamp: new Date(),
          },
        ])
        return
      }
      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()

      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          role: 'assistant',
          content: data.message.content,
          timestamp: new Date(data.message.timestamp),
          metadata: data.message.metadata,
        },
      ])
      setOptions(data.message.metadata?.options || [])
      if (data.crisis?.detected) setCrisisDetected(data.crisis)
      if (data.recommendation) setRecommendation(data.recommendation)
    } catch (error) {
      console.error('Failed to send message:', error)
      toast({
        title: 'Fehler',
        description: 'Nachricht konnte nicht gesendet werden.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  // Handle form submit
  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  // Handle restart. We deliberately don't call initializeSession() here:
  // setSessionId(null) re-creates the initializeSession callback with a
  // fresh closure (sessionId === null), and the mount-effect re-runs
  // because the callback identity changed, which kicks off a new session.
  // Calling it inline would use the stale closure (sessionId still
  // truthy) and early-return — leaving the chat empty.
  const handleRestart = async () => {
    if (sessionId) {
      try {
        await fetch(`/api/navigator?sessionId=${sessionId}`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('Failed to clear session:', error)
      }
    }

    setSessionId(null)
    setMessages([])
    setOptions([])
    setRecommendation(null)
    setCrisisDetected(null)
  }

  // Handle view events for program
  const handleViewEvents = (programId: string) => {
    window.open(`/events/program/${programId}`, '_blank')
  }

  return (
    <div className={`flex flex-col lg:flex-row gap-6 ${className}`}>
      {/* Chat Column */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary" />
                  Studiennavigator
                </CardTitle>
                {modelName && (
                  <span className="text-xs text-muted-foreground">Powered by {modelName}</span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleRestart} disabled={isLoading}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Neu starten
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Crisis Banner */}
            {crisisDetected?.detected && (
              <div className="p-4 border-b">
                <CrisisSupportBanner
                  resources={crisisDetected.resources}
                  severity={crisisDetected.severity}
                />
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[300px] max-h-[500px]">
              {messages.map((message) => (
                <NavigatorMessage key={message.id} message={message} />
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Denke nach...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {options.length > 0 && !isLoading && (
              <div className="px-4 py-2 border-t bg-muted/30">
                <NavigatorSuggestions
                  options={options}
                  onSelect={handleSuggestionClick}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Antwort oder Frage eingeben..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {recommendation && (
        <div className="lg:w-[400px] space-y-4">
          <NavigatorRecommendations
            recommendation={recommendation}
            onProgramSelect={onProgramSelect}
            onViewEvents={handleViewEvents}
          />
          <EndSessionResources resources={END_SESSION_RESOURCES} />
        </div>
      )}
    </div>
  )
}

export default NavigatorChat
