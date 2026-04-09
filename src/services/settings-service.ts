import { prisma } from '@/lib/db/prisma'

export interface DeadlineInfo {
  deadline: Date | null
  deadlineEnabled: boolean
  passed: boolean
  daysRemaining: number | null
}

/**
 * Get current site settings, creating default if not found.
 */
export async function getSettings() {
  let settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  })

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: 'default' },
    })
  }

  return settings
}

/**
 * Update site settings.
 */
export async function updateSettings(data: {
  hitDate?: string | null
  submissionDeadline?: string | null
  deadlineEnabled?: boolean
}) {
  return prisma.siteSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      hitDate: data.hitDate ? new Date(data.hitDate) : null,
      submissionDeadline: data.submissionDeadline ? new Date(data.submissionDeadline) : null,
      deadlineEnabled: data.deadlineEnabled ?? true,
    },
    update: {
      hitDate:
        data.hitDate !== undefined ? (data.hitDate ? new Date(data.hitDate) : null) : undefined,
      submissionDeadline:
        data.submissionDeadline !== undefined
          ? data.submissionDeadline
            ? new Date(data.submissionDeadline)
            : null
          : undefined,
      deadlineEnabled: data.deadlineEnabled !== undefined ? data.deadlineEnabled : undefined,
    },
  })
}

/**
 * Check if the submission deadline has passed.
 * Returns false if deadline is disabled or not set.
 */
export async function isDeadlinePassed(): Promise<boolean> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  })

  if (!settings?.submissionDeadline || !settings.deadlineEnabled) {
    return false
  }

  return new Date() > settings.submissionDeadline
}

/**
 * Get deadline info for frontend display.
 */
export async function getDeadlineInfo(): Promise<DeadlineInfo> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  })

  if (!settings?.submissionDeadline) {
    return { deadline: null, deadlineEnabled: false, passed: false, daysRemaining: null }
  }

  const now = new Date()
  const deadline = settings.submissionDeadline
  const passed = settings.deadlineEnabled && now > deadline

  let daysRemaining: number | null = null
  if (!passed) {
    daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return {
    deadline,
    deadlineEnabled: settings.deadlineEnabled,
    passed,
    daysRemaining,
  }
}
