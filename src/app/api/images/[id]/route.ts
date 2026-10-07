import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

/** GET /api/images/[id] — an uploaded event photo. Images never change, so cache for a year. */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params
  const image = await prisma.uploadedImage.findUnique({
    where: { id },
    select: { mimeType: true, data: true },
  })

  if (!image) {
    return NextResponse.json({ error: 'Bild nicht gefunden' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      'Content-Type': image.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
