import nodemailer from 'nodemailer'
import { generateNewEventEmail, generateEditEventEmail, detectChanges } from '@/lib/email-templates'
import type { EmailEvent } from '@/lib/email-templates'

// ─── Configuration ────────────────────────────────────────────────────────────

function isConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM && process.env.EMAIL_TO)
}

function createTransport() {
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a notification email when a new event is submitted.
 * Fire-and-forget safe: never throws, logs errors instead.
 */
export async function sendEventCreatedEmail(event: EmailEvent): Promise<void> {
  if (!isConfigured()) {
    console.warn('[email] SMTP not configured — skipping sendEventCreatedEmail')
    return
  }

  try {
    const { subject, html } = generateNewEventEmail(event)
    const transport = createTransport()
    await transport.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject,
      html,
    })
  } catch (error) {
    console.error('[email] Failed to send event-created email:', error)
  }
}

/**
 * Send a notification email when an existing event is updated.
 * Skips if no changes are detected.
 * Fire-and-forget safe: never throws, logs errors instead.
 */
export async function sendEventUpdatedEmail(
  oldEvent: EmailEvent,
  newEvent: EmailEvent
): Promise<void> {
  if (!isConfigured()) {
    console.warn('[email] SMTP not configured — skipping sendEventUpdatedEmail')
    return
  }

  try {
    const changes = detectChanges(oldEvent, newEvent)
    if (changes.length === 0) {
      console.warn('[email] No changes detected — skipping sendEventUpdatedEmail')
      return
    }

    const { subject, html } = generateEditEventEmail(newEvent, changes)
    const transport = createTransport()
    await transport.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject,
      html,
    })
  } catch (error) {
    console.error('[email] Failed to send event-updated email:', error)
  }
}
