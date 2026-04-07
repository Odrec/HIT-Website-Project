import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

// GET: fetch site settings (public — event form needs the HIT date)
export async function GET() {
  let settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  })

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: 'default' },
    })
  }

  return NextResponse.json(settings)
}

// PUT: update site settings (admin only)
export async function PUT(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const body = await request.json()
  const { hitDate } = body

  const settings = await prisma.siteSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      hitDate: hitDate ? new Date(hitDate) : null,
    },
    update: {
      hitDate: hitDate ? new Date(hitDate) : null,
    },
  })

  return NextResponse.json(settings)
}
