import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'

interface Props {
  params: Promise<{ code: string }>
}

export default async function ShortLinkPage({ params }: Props) {
  const { code } = await params

  const shared = await prisma.sharedSchedule.findUnique({
    where: { code },
  })

  if (!shared) {
    notFound()
  }

  const encoded = Buffer.from(JSON.stringify(shared.eventIds)).toString('base64')
  redirect(`/schedule?share=${encoded}`)
}
