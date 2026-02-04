'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Send, RotateCcw, Compass, MessageSquare } from 'lucide-react'
import { NavigatorMessage } from './NavigatorMessage'
import { NavigatorSuggestions } from './NavigatorSuggestions'
import { NavigatorRecommendations } from './NavigatorRecommendations'
import { CrisisSupportBanner } from './CrisisSupportBanner'
import { EndSessionResources } from './EndSessionResources'
import type {
  NavigatorMessage as NavigatorMessageType,
  ProgramRecommendation,
  EndSessionResource,
  CrisisDetection,
} from '@/types/navigator'
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
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<ProgramRecommendation[]>([])
  const [endResources, setEndResources] = useState<EndSessionResource[]>([])
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [crisisDetected, setCrisisDetected] = useState<CrisisDetection | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initializingRef = useRef(false)
  const { toast } = useToast()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize session (with ref guard to prevent duplicate calls in StrictMode)
  const initializeSession = useCallback(async () => {
    if (initializingRef.current || sessionId) return
    initializingRef.current = true
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/navigator')
      if (!response.ok) throw new Error('Failed to initialize')
      
      const data = await response.json()
      setSessionId(data.sessionId)
      
      const initialMessage: NavigatorMessageType = {
        id: data.message.id,
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(data.message.timestamp),
        metadata: data.message.metadata,
      }
      
      setMessages([initialMessage])
      setSuggestions(data.message.metadata?.suggestedResponses || [])
    } catch (error) {
      console.error('Failed to initialize navigator:', error)
      toast({
        title: 'Fehler',
        description: 'Navigator konnte nicht initialisiert werden.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
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
    setSuggestions([])
    setIsLoading(true)

    try {
      const response = await fetch('/api/navigator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()

      const assistantMessage: NavigatorMessageType = {
        id: data.message.id,
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(data.message.timestamp),
        metadata: data.message.metadata,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setSuggestions(data.message.metadata?.suggestedResponses || [])

      if (data.crisis?.detected) {
        setCrisisDetected(data.crisis)
      }

      if (data.session?.completed) {
        setIsComplete(true)
        await loadRecommendations()
      }

      // Auto-load OR refresh recommendations after enough messages
      if (data.session?.messageCount >= 4 || showRecommendations) {
        await loadRecommendations()
      }
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

  // Load recommendations
  const loadRecommendations = async () => {
    try {
      const url = sessionId
        ? `/api/navigator/recommendations?sessionId=${sessionId}&limit=10`
        : `/api/navigator/recommendations?limit=10`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error('Recommendations response not ok:', response.status)
        // Still show the panel even if there's an error
        setShowRecommendations(true)
        return
      }

      const data = await response.json()
      setRecommendations(data.programs || [])
      setEndResources(data.endResources || [])
      setShowRecommendations(true)
      
      // Update session ID if a new one was created
      if (data.newSessionId && data.newSessionId !== sessionId) {
        setSessionId(data.newSessionId)
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error)
      // Show panel anyway so user can see something
      setShowRecommendations(true)
    }
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  // Handle restart
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
    setSuggestions([])
    setRecommendations([])
    setEndResources([])
    setShowRecommendations(false)
    setCrisisDetected(null)
    setIsComplete(false)

    await initializeSession()
  }

  // Handle view events for program
  const handleViewEvents = (programId: string) => {
    window.open(`/events?studyProgram=${programId}`, '_blank')
  }

  return (
    <div className={`flex flex-col lg:flex-row gap-6 ${className}`}>
      {/* Chat Column */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                Studiennavigator
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestart}
                disabled={isLoading}
              >
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
            {suggestions.length > 0 && !isLoading && (
              <div className="px-4 py-2 border-t bg-muted/30">
                <NavigatorSuggestions
                  suggestions={suggestions}
                  onSelect={handleSuggestionClick}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t flex gap-2"
            >
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Schreibe eine Nachricht..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                size="icon"
              >
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

      {/* Recommendations Column */}
      {showRecommendations && (
        <div className="lg:w-[400px] space-y-4">
          <NavigatorRecommendations
            programs={recommendations}
            onProgramSelect={onProgramSelect}
            onViewEvents={handleViewEvents}
          />

          {isComplete && endResources.length > 0 && (
            <EndSessionResources resources={endResources} />
          )}
        </div>
      )}

      {/* Show recommendations button if not visible */}
      {!showRecommendations && messages.length >= 4 && (
        <div className="lg:w-[300px]">
          <Card className="bg-primary/5">
            <CardContent className="py-6 text-center">
              <MessageSquare className="w-8 h-8 mx-auto text-primary mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Möchtest du jetzt Studiengänge sehen, die zu deinen Interessen passen?
              </p>
              <Button onClick={loadRecommendations} disabled={isLoading}>
                Empfehlungen anzeigen
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default NavigatorChat
