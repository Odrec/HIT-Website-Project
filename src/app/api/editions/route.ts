import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { listEditions, createEdition } from '@/services/edition-service'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }
  const editions = await listEditions()
  return NextResponse.json(editions)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }
  const body = await request.json()
  if (typeof body.year !== 'number' || !Number.isInteger(body.year)) {
    return NextResponse.json({ error: 'year muss eine ganze Zahl sein' }, { status: 400 })
  }
  const hitDate = new Date(body.hitDate)
  if (Number.isNaN(hitDate.getTime())) {
    return NextResponse.json({ error: 'hitDate ist ungültig' }, { status: 400 })
  }
  let submissionDeadline: Date | null = null
  if (body.submissionDeadline) {
    submissionDeadline = new Date(body.submissionDeadline)
    if (Number.isNaN(submissionDeadline.getTime())) {
      return NextResponse.json({ error: 'submissionDeadline ist ungültig' }, { status: 400 })
    }
  }
  try {
    const edition = await createEdition({
      year: body.year,
      hitDate,
      submissionDeadline,
      deadlineEnabled: body.deadlineEnabled,
    })
    return NextResponse.json(edition, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create edition'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}