// Study Programs API - GET, PUT, DELETE for individual program

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/auth'
import { normalizeLinksInput } from '@/lib/study-program-links'
import { normalizeLehramtInput } from '@/lib/lehramt'
import { invalidateProgramCaches } from '@/lib/cache/cache-utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/study-programs/[id] - Get a single study program
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const program = await prisma.studyProgram.findUnique({
      where: { id },
      include: {
        clusters: true,
        events: {
          include: {
            event: true,
          },
        },
      },
    })

    if (!program) {
      return NextResponse.json({ error: 'Study program not found' }, { status: 404 })
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error fetching study program:', error)
    return NextResponse.json({ error: 'Failed to fetch study program' }, { status: 500 })
  }
}

/**
 * PUT /api/study-programs/[id] - Update a study program (requires admin)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if program exists
    const existing = await prisma.studyProgram.findUnique({
      where: { id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Study program not found' }, { status: 404 })
    }

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
    }

    if (!body.institution || !['UNI', 'HOCHSCHULE', 'BOTH'].includes(body.institution)) {
      return NextResponse.json({ error: 'Invalid or missing institution' }, { status: 400 })
    }

    const clusterIds: string[] = Array.isArray(body.clusterIds)
      ? body.clusterIds.filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)
      : []

    const links = normalizeLinksInput(body.links)

    const lehramt = normalizeLehramtInput(body)
    if (!lehramt.ok) {
      return NextResponse.json({ error: lehramt.error }, { status: 400 })
    }

    const program = await prisma.studyProgram.update({
      where: { id },
      data: {
        name: body.name,
        institution: body.institution,
        lehramtTypen: lehramt.value.lehramtTypen,
        isLehramtStudiengang: lehramt.value.isLehramtStudiengang,
        isBeruflicheFachrichtung: lehramt.value.isBeruflicheFachrichtung,
        clusters: { set: clusterIds.map((cid) => ({ id: cid })) },
        links: {
          deleteMany: {},
          create: links,
        },
      },
      include: {
        clusters: true,
        links: { orderBy: { sortOrder: 'asc' } },
      },
    })

    await invalidateProgramCaches()

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error updating study program:', error)
    return NextResponse.json({ error: 'Failed to update study program' }, { status: 500 })
  }
}

/**
 * DELETE /api/study-programs/[id] - Delete a study program (requires admin)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { id } = await params

    // Check if program exists
    const existing = await prisma.studyProgram.findUnique({
      where: { id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Study program not found' }, { status: 404 })
    }

    // Deleting a program only removes the program and its event *links*
    // (EventStudyProgram cascades on delete) — the events themselves stay and
    // keep all their other Studiengang associations. So a program that is still
    // linked to events can be deleted; the links are simply cleared.
    await prisma.studyProgram.delete({
      where: { id },
    })

    await invalidateProgramCaches()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting study program:', error)
    return NextResponse.json({ error: 'Failed to delete study program' }, { status: 500 })
  }
}
