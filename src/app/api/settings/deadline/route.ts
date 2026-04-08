import { NextResponse } from 'next/server'
import { getDeadlineInfo } from '@/services/settings-service'

export async function GET() {
  const info = await getDeadlineInfo()
  return NextResponse.json(info)
}
