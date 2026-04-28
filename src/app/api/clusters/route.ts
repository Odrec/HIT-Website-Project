import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const clusters = await prisma.studyProgramCluster.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      institution: true,
    },
  })

  const uni = clusters.filter((c) => c.institution === 'UNI')
  const hochschule = clusters.filter((c) => c.institution === 'HOCHSCHULE')

  return NextResponse.json({ uni, hochschule })
}
