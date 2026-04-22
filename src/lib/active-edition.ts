import { cache } from 'react'
import { prisma } from '@/lib/db/prisma'

export const getActiveEdition = cache(async () => {
  const edition = await prisma.hitEdition.findFirst({ where: { status: 'ACTIVE' } })
  if (!edition) {
    throw new Error('No ACTIVE HitEdition — admin must activate one in /admin/editions')
  }
  return edition
})

export const getActiveEditionId = cache(async () => {
  const edition = await getActiveEdition()
  return edition.id
})