import { NextResponse } from 'next/server'
import { getDeadlineInfo } from '@/services/edition-service'

export async function GET() {
  try {
    const info = await getDeadlineInfo()
    return NextResponse.json(info)
  } catch (error) {
    console.error('Failed to get deadline info:', error)
    return NextResponse.json(
      { deadline: null, deadlineEnabled: false, passed: false, daysRemaining: null },
      { status: 500 }
    )
  }
}
