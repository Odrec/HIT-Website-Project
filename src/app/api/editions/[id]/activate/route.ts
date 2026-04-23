import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { activateEdition } from '@/services/edition-service'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }
  const { id } = await params
  try {
    await activateEdition(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to activate'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
