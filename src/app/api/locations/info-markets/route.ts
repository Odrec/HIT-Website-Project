// Information Markets API

import { NextResponse } from 'next/server'
import { locationService } from '@/services'

/**
 * GET /api/locations/info-markets - List all information markets
 */
export async function GET() {
  try {
    const markets = await locationService.listInfoMarkets()
    return NextResponse.json(markets)
  } catch (error) {
    console.error('Error fetching info markets:', error)
    return NextResponse.json({ error: 'Failed to fetch information markets' }, { status: 500 })
  }
}
