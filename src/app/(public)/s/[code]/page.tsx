import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'

interface Props {
  params: Promise<{ code: string }>
}

export default async function ShortLinkPage({ params }: Props) {
  const { code } = await params

  const shared = await prisma.sharedSchedule.findUnique({
    where: { code },
    select: { code: true },
  })

  if (!shared) {
    notFound()
  }

  redirect(`/schedule?share=${shared.code}`)
}
