// Navigator Recommendations API – return the recommendation stored on a session
import { NextRequest, NextResponse } from 'next/server'
import { navigatorService, NAVIGATOR_SESSION_ID_RE } from '@/services/navigator-service'

/** GET /api/navigator/recommendations?sessionId= */
export async function GET(request: NextRequest) {
  try {
    const sessionId = new URL(request.url).searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }
    if (!NAVIGATOR_SESSION_ID_RE.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
    }
    const recommendation = await navigatorService.getRecommendation(sessionId)
    return NextResponse.json({ recommendation })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}
