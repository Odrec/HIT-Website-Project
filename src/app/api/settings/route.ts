import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSettings, updateSettings } from '@/services/settings-service'

// GET: fetch site settings (public — event form needs the HIT date and deadline)
export async function GET() {
  const settings = await getSettings()
  return NextResponse.json(settings)
}

// PUT: update site settings (admin only)
export async function PUT(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const body = await request.json()
  const settings = await updateSettings({
    hitDate: body.hitDate,
    submissionDeadline: body.submissionDeadline,
    deadlineEnabled: body.deadlineEnabled,
  })

  return NextResponse.json(settings)
}
