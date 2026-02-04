// Study Programs API - GET, PUT, DELETE for individual program

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/study-programs/[id] - Get a single study program
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const program = await prisma.studyProgram.findUnique({
      where: { id },
      include: {
        cluster: true,
        events: {
          include: {
            event: true,
          },
        },
      },
    })

    if (!program) {
      return NextResponse.json(
        { error: 'Study program not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error fetching study program:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study program' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/study-programs/[id] - Update a study program (requires admin)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Check if program exists
    const existing = await prisma.studyProgram.findUnique({
      where: { id },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Study program not found' },
        { status: 404 }
      )
    }

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

    const program = await prisma.studyProgram.update({
      where: { id },
      data: {
        name: body.name,
        institution: body.institution,
        clusterId: body.clusterId || null,
      },
      include: {
        cluster: true,
      },
    })

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error updating study program:', error)
    return NextResponse.json(
      { error: 'Failed to update study program' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/study-programs/[id] - Delete a study program (requires admin)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if program exists
    const existing = await prisma.studyProgram.findUnique({
      where: { id },
      include: {
        events: true,
      },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Study program not found' },
        { status: 404 }
      )
    }

    // Check if program is used by events
    if (existing.events && existing.events.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete study program - it is used by events',
          message: `Dieser Studiengang wird von ${existing.events.length} Veranstaltung(en) verwendet und kann nicht gelöscht werden.`
        },
        { status: 400 }
      )
    }

    await prisma.studyProgram.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting study program:', error)
    return NextResponse.json(
      { error: 'Failed to delete study program' },
      { status: 500 }
    )
  }
}
