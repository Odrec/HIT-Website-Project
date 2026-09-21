// Navigator API – session and message handling
import { NextRequest, NextResponse } from 'next/server'
import {
  navigatorService,
  NavigatorUnavailableError,
  NAVIGATOR_SESSION_ID_RE,
} from '@/services/navigator-service'
import { withRateLimit } from '@/lib/rate-limit'

const NAVIGATOR_POST_LIMIT = { maxRequests: 20, windowSeconds: 60, keyPrefix: 'rl:navigator:post' }
const NAVIGATOR_GET_LIMIT = { maxRequests: 10, windowSeconds: 60, keyPrefix: 'rl:navigator:get' }

/** GET /api/navigator – create a session and return greeting + first question */
export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, NAVIGATOR_GET_LIMIT)
  if (limited) return limited

  try {
    const session = await navigatorService.startSession()
    return NextResponse.json({
      sessionId: session.id,
      message: session.messages[0],
      phase: session.phase,
      model: navigatorService.getModelDisplayName(),
    })
  } catch (error) {
    console.error('Navigator init error:', error)
    return NextResponse.json({ error: 'Failed to initialize navigator' }, { status: 500 })
  }
}

/** POST /api/navigator – send a message, get the model's reply */
export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, NAVIGATOR_POST_LIMIT)
  if (limited) return limited

  try {
    const body = await request.json()
    const { sessionId, message } = body as { sessionId?: unknown; message?: unknown }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    const id =
      typeof sessionId === 'string' && NAVIGATOR_SESSION_ID_RE.test(sessionId)
        ? sessionId
        : (await navigatorService.startSession()).id

    const result = await navigatorService.processMessage(id, message.trim())

    return NextResponse.json({
      sessionId: result.session.id,
      message: result.response,
      phase: result.session.phase,
      recommendation: result.recommendation,
      crisis: result.crisis,
      model: navigatorService.getModelDisplayName(),
    })
  } catch (error) {
    if (error instanceof NavigatorUnavailableError) {
      return NextResponse.json({ error: 'unavailable' }, { status: 503 })
    }
    console.error('Navigator error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}

/** DELETE /api/navigator?sessionId= – clear a session */
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = new URL(request.url).searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }
    if (!NAVIGATOR_SESSION_ID_RE.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
    }
    await navigatorService.clearSession(sessionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Navigator delete error:', error)
    return NextResponse.json({ error: 'Failed to clear session' }, { status: 500 })
  }
}
