// Study Programs API - GET and POST endpoints

import { NextRequest, NextResponse } from 'next/server'
import { studyProgramService } from '@/services'
import { prisma } from '@/lib/db/prisma'
import { Institution } from '@/types/events'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

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

/**
 * POST /api/study-programs - Create a new study program (requires admin)
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

    if (!body.institution || !['UNI', 'HOCHSCHULE', 'BOTH'].includes(body.institution)) {
      return NextResponse.json(
        { error: 'Invalid or missing institution' },
        { status: 400 }
      )
    }

    const program = await prisma.studyProgram.create({
      data: {
        name: body.name,
        institution: body.institution,
        clusterId: body.clusterId || null,
      },
      include: {
        cluster: true,
      },
    })

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error('Error creating study program:', error)
    return NextResponse.json(
      { error: 'Failed to create study program' },
      { status: 500 }
    )
  }
}
