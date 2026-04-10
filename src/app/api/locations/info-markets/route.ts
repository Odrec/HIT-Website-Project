// Information Markets API

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/locations/info-markets - List all information markets
 */
export async function GET() {
  try {
    const markets = await prisma.informationMarket.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(markets)
  } catch (error) {
    console.error('Error fetching info markets:', error)
    return NextResponse.json({ error: 'Failed to fetch information markets' }, { status: 500 })
  }
}