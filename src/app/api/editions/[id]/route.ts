import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getEdition,
  updateEdition,
  deleteEdition,
  activateEdition,
} from '@/services/edition-service'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const edition = await getEdition(id)
  if (!edition) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(edition)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json()

  // Special action: activate
  if (body.action === 'activate') {
    try {
      await activateEdition(id)
      return NextResponse.json({ ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate'
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  try {
    const edition = await updateEdition(id, {
      ...(body.hitDate !== undefined && { hitDate: new Date(body.hitDate) }),
      ...(body.submissionDeadline !== undefined && {
        submissionDeadline: body.submissionDeadline ? new Date(body.submissionDeadline) : null,
      }),
      ...(body.deadlineEnabled !== undefined && { deadlineEnabled: body.deadlineEnabled }),
    })
    return NextResponse.json(edition)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }
  const { id } = await params
  try {
    await deleteEdition(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}