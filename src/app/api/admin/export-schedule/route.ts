import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/admin/export-schedule - Get the current export schedule
 */
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const schedule = await prisma.exportSchedule.findFirst({
    where: { type: 'html' },
    orderBy: { updatedAt: 'desc' },
  })

  if (!schedule) {
    return NextResponse.json({ enabled: false, startDate: null, frequency: 'daily' })
  }

  return NextResponse.json(schedule)
}

/**
 * POST /api/admin/export-schedule - Create or update export schedule
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { enabled, startDate, frequency } = body

  const existing = await prisma.exportSchedule.findFirst({
    where: { type: 'html' },
  })

  if (existing) {
    const updated = await prisma.exportSchedule.update({
      where: { id: existing.id },
      data: {
        enabled,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        frequency: frequency || existing.frequency,
      },
    })
    return NextResponse.json(updated)
  }

  const created = await prisma.exportSchedule.create({
    data: {
      type: 'html',
      enabled: enabled ?? false,
      startDate: startDate ? new Date(startDate) : new Date(),
      frequency: frequency || 'daily',
    },
  })
  return NextResponse.json(created, { status: 201 })
}
