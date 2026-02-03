// Study Programs API - GET endpoints

import { NextRequest, NextResponse } from 'next/server'
import { studyProgramService } from '@/services'
import { Institution } from '@/types/events'

/**
 * GET /api/study-programs - List all study programs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const institution = searchParams.get('institution') as Institution | undefined
    const grouped = searchParams.get('grouped') === 'true'

    if (grouped) {
      const result = await studyProgramService.getGroupedByCluster(institution)
      return NextResponse.json(result)
    }

    const programs = await studyProgramService.list(
      institution ? { institution } : undefined
    )

    return NextResponse.json(programs)
  } catch (error) {
    console.error('Error fetching study programs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study programs' },
      { status: 500 }
    )
  }
}
