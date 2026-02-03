// Study Program Clusters API

import { NextResponse } from 'next/server'
import { studyProgramService } from '@/services'

/**
 * GET /api/study-programs/clusters - List all study program clusters
 */
export async function GET() {
  try {
    const clusters = await studyProgramService.listClusters()
    return NextResponse.json(clusters)
  } catch (error) {
    console.error('Error fetching clusters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clusters' },
      { status: 500 }
    )
  }
}
