import { NextRequest, NextResponse } from 'next/server'
import { validateGuideToken, setBusPause, resumeBus } from '@/services/shuttle-service'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice(7)
    const bus = await validateGuideToken(token)
    if (!bus) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const mode = body?.mode

    if (mode === 'resume') {
      await resumeBus(bus.id)
      return NextResponse.json({ ok: true, busName: bus.name, paused: false, pausedUntil: null })
    }

    if (mode === 'open') {
      await setBusPause(bus.id, { until: null, indefinite: true })
      return NextResponse.json({ ok: true, busName: bus.name, paused: true, pausedUntil: null })
    }

    if (mode === 'until') {
      const minutes = body?.minutes
      if (!Number.isInteger(minutes) || minutes <= 0 || minutes > 240) {
        return NextResponse.json({ error: 'minutes must be an integer in 1..240' }, { status: 400 })
      }
      const until = new Date(Date.now() + minutes * 60_000)
      await setBusPause(bus.id, { until, indefinite: false })
      return NextResponse.json({
        ok: true,
        busName: bus.name,
        paused: true,
        pausedUntil: until.toISOString(),
      })
    }

    return NextResponse.json({ error: 'invalid mode' }, { status: 400 })
  } catch (error) {
    console.error('Error setting bus pause:', error)
    return NextResponse.json({ error: 'Failed to set pause' }, { status: 500 })
  }
}
