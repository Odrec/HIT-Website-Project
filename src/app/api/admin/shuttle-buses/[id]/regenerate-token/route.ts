import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { regenerateToken } from '@/services/shuttle-service'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const bus = await regenerateToken(id)
    return NextResponse.json(bus)
  } catch (error) {
    console.error('Error regenerating token:', error)
    return NextResponse.json({ error: 'Failed to regenerate token' }, { status: 500 })
  }
}
