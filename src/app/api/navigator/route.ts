// Navigator API - Session and message handling
import { NextRequest, NextResponse } from 'next/server'
import { navigatorService } from '@/services/navigator-service'

/**
 * Get the AI model name for display
 * Priority matches navigator-service.ts: OPENAI_API_KEY > GOOGLE_AI_API_KEY > fallback
 */
function getModelDisplayName(): string {
  const openaiApiKey = process.env.OPENAI_API_KEY
  const googleApiKey = process.env.GOOGLE_AI_API_KEY
  
  let model: string
  let provider: string
  
  if (openaiApiKey) {
    model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    provider = 'OpenAI'
  } else if (googleApiKey) {
    model = process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash'
    provider = 'Google'
  } else {
    return 'Fallback Mode (No AI configured)'
  }
  
  // Format model name for display: "gpt-4o-mini" -> "GPT 4o Mini"
  const formattedModel = model
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
  
  return `${provider} ${formattedModel}`
}

/**
 * POST /api/navigator
 * Send a message to the navigator and get a response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Create new session if not provided
    const session = sessionId 
      ? navigatorService.getSession(sessionId) || navigatorService.createSession()
      : navigatorService.createSession()

    // Process the message
    const result = await navigatorService.processMessage(session.id, message)

    return NextResponse.json({
      sessionId: result.session.id,
      message: result.response,
      session: {
        id: result.session.id,
        messageCount: result.session.messages.length,
        crisisDetected: result.session.crisisDetected,
        completed: result.session.completed,
      },
      crisis: result.crisis,
      model: getModelDisplayName(),
    })
  } catch (error) {
    console.error('Navigator error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/navigator
 * Create a new session and get initial message
 */
export async function GET() {
  try {
    const session = navigatorService.createSession()
    
    // Generate initial greeting
    const result = await navigatorService.processMessage(
      session.id,
      '__INIT__'
    )

    return NextResponse.json({
      sessionId: session.id,
      message: {
        id: `msg-init-${Date.now()}`,
        role: 'assistant',
        content: 'Willkommen beim Studiennavigator! Ich helfe dir dabei, den passenden Studiengang zu finden. Was interessiert dich besonders? Welche Themen oder Fächer faszinieren dich?',
        timestamp: new Date(),
        metadata: {
          suggestedResponses: [
            'Naturwissenschaften und Technik',
            'Sprachen und Kultur',
            'Wirtschaft und Management',
            'Soziales und Gesundheit',
          ],
        },
      },
      model: getModelDisplayName(),
    })
  } catch (error) {
    console.error('Navigator init error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize navigator' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/navigator
 * Clear a session
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    navigatorService.clearSession(sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Navigator delete error:', error)
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    )
  }
}
