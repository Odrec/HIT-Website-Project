// Study Program Clusters API

import { NextRequest, NextResponse } from 'next/server'
import { studyProgramService } from '@/services'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

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

/**
 * POST /api/study-programs/clusters - Create a new cluster (requires admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    const cluster = await prisma.studyProgramCluster.create({
      data: {
        name: body.name,
        description: body.description || null,
      },
      include: {
        programs: true,
      },
    })

    return NextResponse.json(cluster, { status: 201 })
  } catch (error) {
    console.error('Error creating cluster:', error)
    return NextResponse.json(
      { error: 'Failed to create cluster' },
      { status: 500 }
    )
  }
}
