// Users API - GET and POST endpoints

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import bcrypt from 'bcryptjs'

/**
 * GET /api/users - List all users (requires admin)
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ role: 'asc' }, { email: 'asc' }],
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

/**
 * POST /api/users - Create a new user (requires admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.email) {
      return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 })
    }

    if (!body.password) {
      return NextResponse.json({ error: 'Missing required field: password' }, { status: 400 })
    }

    if (body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (!body.role || !['ADMIN', 'ORGANIZER', 'PUBLIC'].includes(body.role)) {
      return NextResponse.json({ error: 'Invalid or missing role' }, { status: 400 })
    }

    // Check if email is already taken
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Email already in use', message: 'Diese E-Mail-Adresse wird bereits verwendet.' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 10)

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name || null,
        role: body.role,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
