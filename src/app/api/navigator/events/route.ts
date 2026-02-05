// Navigator Events API - Get events for recommended programs
import { NextRequest, NextResponse } from 'next/server'
import { navigatorService } from '@/services/navigator-service'

/**
 * GET /api/navigator/events
 * Get events for specified program IDs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programIds = searchParams.get('programIds')

    if (!programIds) {
      return NextResponse.json({ error: 'Program IDs are required' }, { status: 400 })
    }

    const ids = programIds.split(',').filter((id) => id.trim())

    if (ids.length === 0) {
      return NextResponse.json({ events: [] })
    }

    const events = await navigatorService.getEventsForPrograms(ids)

    return NextResponse.json({
      events,
      total: events.length,
    })
  } catch (error) {
    console.error('Navigator events error:', error)
    return NextResponse.json({ error: 'Failed to get events' }, { status: 500 })
  }
}
