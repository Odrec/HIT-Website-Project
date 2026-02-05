// Navigator Recommendations API
import { NextRequest, NextResponse } from 'next/server'
import { navigatorService } from '@/services/navigator-service'

/**
 * GET /api/navigator/recommendations
 * Get program recommendations for a session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Session ID is optional now - if not found, create one
    let session = sessionId ? navigatorService.getSession(sessionId) : null

    // If session not found, create a new one
    if (!session) {
      session = navigatorService.createSession()
      console.log('Created new session for recommendations:', session.id)
    }

    const recommendations = await navigatorService.getRecommendations(session.id, limit)

    return NextResponse.json({
      programs: recommendations.programs,
      clusters: recommendations.clusters,
      endResources: recommendations.endResources,
      sessionComplete: session.completed,
      newSessionId: session.id, // Return new session ID if created
    })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}
