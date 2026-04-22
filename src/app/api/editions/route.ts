import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { listEditions, createEdition } from '@/services/edition-service'

export async function GET() {
  const editions = await listEditions()
  return NextResponse.json(editions)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }
  const body = await request.json()
  try {
    const edition = await createEdition({
      year: body.year,
      hitDate: new Date(body.hitDate),
      submissionDeadline: body.submissionDeadline ? new Date(body.submissionDeadline) : null,
      deadlineEnabled: body.deadlineEnabled,
    })
    return NextResponse.json(edition, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create edition'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}