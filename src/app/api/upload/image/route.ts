import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { detectImageType } from '@/lib/event-media'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * POST /api/upload/image — store an event photo in the database and return
 * its public address (/api/images/<id>). See src/lib/event-media.ts for why
 * the bytes live in the database rather than in public/.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Die Datei ist zu groß (max. 5 MB).' }, { status: 400 })
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const mimeType = detectImageType(bytes)
  if (!mimeType) {
    return NextResponse.json(
      { error: 'Nur JPEG-, PNG- und WebP-Bilder sind erlaubt.' },
      { status: 400 }
    )
  }

  const image = await prisma.uploadedImage.create({
    data: { mimeType, data: bytes },
    select: { id: true },
  })

  return NextResponse.json({ url: `/api/images/${image.id}` })
}
