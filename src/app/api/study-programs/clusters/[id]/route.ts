// Study Program Clusters API - GET, PUT, DELETE for individual cluster

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/study-programs/clusters/[id] - Get a single cluster
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const cluster = await prisma.studyProgramCluster.findUnique({
      where: { id },
      include: {
        programs: true,
      },
    })

    if (!cluster) {
      return NextResponse.json(
        { error: 'Cluster not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(cluster)
  } catch (error) {
    console.error('Error fetching cluster:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cluster' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/study-programs/clusters/[id] - Update a cluster (requires admin)
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

    // Check if cluster exists
    const existing = await prisma.studyProgramCluster.findUnique({
      where: { id },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Cluster not found' },
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

    const cluster = await prisma.studyProgramCluster.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
      },
      include: {
        programs: true,
      },
    })

    return NextResponse.json(cluster)
  } catch (error) {
    console.error('Error updating cluster:', error)
    return NextResponse.json(
      { error: 'Failed to update cluster' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/study-programs/clusters/[id] - Delete a cluster (requires admin)
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

    // Check if cluster exists
    const existing = await prisma.studyProgramCluster.findUnique({
      where: { id },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Cluster not found' },
        { status: 404 }
      )
    }

    // Note: Deleting a cluster will set clusterId to null on associated programs (onDelete: SetNull)
    await prisma.studyProgramCluster.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cluster:', error)
    return NextResponse.json(
      { error: 'Failed to delete cluster' },
      { status: 500 }
    )
  }
}
