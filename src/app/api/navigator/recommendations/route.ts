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

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const session = navigatorService.getSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const recommendations = await navigatorService.getRecommendations(
      sessionId,
      limit
    )

    return NextResponse.json({
      programs: recommendations.programs,
      clusters: recommendations.clusters,
      endResources: recommendations.endResources,
      sessionComplete: session.completed,
    })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}
