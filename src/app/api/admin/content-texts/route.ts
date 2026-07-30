import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { CONTENT_DEFAULTS, CONTENT_SLOTS } from '@/lib/content-slots'
import { mergeContentTexts } from '@/lib/content-texts'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

/** GET — the slot registry plus the currently effective values. */
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })

  const rows = await prisma.contentText.findMany({ select: { key: true, value: true } })
  return NextResponse.json({ slots: CONTENT_SLOTS, values: mergeContentTexts(rows) })
}

/** PUT — store an override for one slot. */
export async function PUT(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { key, value } = body as { key?: string; value?: string }

  if (!key || !(key in CONTENT_DEFAULTS)) {
    return NextResponse.json({ error: 'Unbekannter Textbaustein' }, { status: 400 })
  }
  if (typeof value !== 'string' || !value.trim()) {
    return NextResponse.json({ error: 'Text darf nicht leer sein' }, { status: 400 })
  }

  await prisma.contentText.upsert({
    where: { key },
    create: { key, value, updatedBy: session.user.id },
    update: { value, updatedBy: session.user.id },
  })

  revalidatePath('/home')
  revalidatePath('/')
  return NextResponse.json({ success: true })
}

/** DELETE — drop the override so the shipped default applies again. */
export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })

  const key = new URL(request.url).searchParams.get('key')
  if (!key || !(key in CONTENT_DEFAULTS)) {
    return NextResponse.json({ error: 'Unbekannter Textbaustein' }, { status: 400 })
  }

  await prisma.contentText.deleteMany({ where: { key } })

  revalidatePath('/home')
  revalidatePath('/')
  return NextResponse.json({ success: true })
}
