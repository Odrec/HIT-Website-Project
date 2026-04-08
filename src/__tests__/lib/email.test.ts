import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Use vi.hoisted so mock variables are available in vi.mock factories
const {
  mockSendMail,
  mockCreateTransport,
  mockGenerateNewEventEmail,
  mockGenerateEditEventEmail,
  mockDetectChanges,
} = vi.hoisted(() => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' })
  const mockCreateTransport = vi.fn().mockReturnValue({ sendMail: mockSendMail })
  const mockGenerateNewEventEmail = vi.fn().mockReturnValue({
    subject: 'HIT — Neue Veranstaltung: Test Event',
    html: '<p>New event</p>',
  })
  const mockGenerateEditEventEmail = vi.fn().mockReturnValue({
    subject: 'HIT — Veranstaltung bearbeitet: Test Event',
    html: '<p>Edited event</p>',
  })
  const mockDetectChanges = vi.fn()
  return {
    mockSendMail,
    mockCreateTransport,
    mockGenerateNewEventEmail,
    mockGenerateEditEventEmail,
    mockDetectChanges,
  }
})

vi.mock('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}))

vi.mock('@/lib/email-templates', () => ({
  generateNewEventEmail: mockGenerateNewEventEmail,
  generateEditEventEmail: mockGenerateEditEventEmail,
  detectChanges: mockDetectChanges,
}))

import { sendEventCreatedEmail, sendEventUpdatedEmail } from '@/lib/email'
import type { EmailEvent } from '@/lib/email-templates'

const baseEvent: EmailEvent = {
  id: 'evt-1',
  title: 'Test Event',
  eventType: 'VORTRAG' as never,
  institution: 'UNI' as never,
  locationType: 'OTHER',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

describe('sendEventCreatedEmail', () => {
  beforeEach(() => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.com')
    vi.stubEnv('EMAIL_FROM', 'hit@zsb.os.de')
    vi.stubEnv('EMAIL_TO', 'hit@zsb.os.de')
    mockSendMail.mockClear()
    mockGenerateNewEventEmail.mockClear()
    mockCreateTransport.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('calls generateNewEventEmail with the event', async () => {
    await sendEventCreatedEmail(baseEvent)
    expect(mockGenerateNewEventEmail).toHaveBeenCalledWith(baseEvent)
  })

  it('calls sendMail with correct from/to/subject/html', async () => {
    await sendEventCreatedEmail(baseEvent)
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'hit@zsb.os.de',
        to: 'hit@zsb.os.de',
        subject: 'HIT — Neue Veranstaltung: Test Event',
        html: '<p>New event</p>',
      })
    )
  })

  it('does not throw when SMTP_HOST is missing', async () => {
    vi.stubEnv('SMTP_HOST', '')
    await expect(sendEventCreatedEmail(baseEvent)).resolves.toBeUndefined()
  })

  it('does not call sendMail when SMTP_HOST is missing', async () => {
    vi.stubEnv('SMTP_HOST', '')
    mockSendMail.mockClear()
    await sendEventCreatedEmail(baseEvent)
    expect(mockSendMail).not.toHaveBeenCalled()
  })

  it('does not throw when EMAIL_FROM is missing', async () => {
    vi.stubEnv('EMAIL_FROM', '')
    await expect(sendEventCreatedEmail(baseEvent)).resolves.toBeUndefined()
  })

  it('does not call sendMail when EMAIL_FROM is missing', async () => {
    vi.stubEnv('EMAIL_FROM', '')
    mockSendMail.mockClear()
    await sendEventCreatedEmail(baseEvent)
    expect(mockSendMail).not.toHaveBeenCalled()
  })
})

describe('sendEventUpdatedEmail', () => {
  const updatedEvent: EmailEvent = { ...baseEvent, title: 'Updated Event' }

  beforeEach(() => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.com')
    vi.stubEnv('EMAIL_FROM', 'hit@zsb.os.de')
    vi.stubEnv('EMAIL_TO', 'hit@zsb.os.de')
    mockSendMail.mockClear()
    mockGenerateEditEventEmail.mockClear()
    mockDetectChanges.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('calls detectChanges with oldEvent and newEvent', async () => {
    mockDetectChanges.mockReturnValue([
      { field: 'title', oldValue: 'Test Event', newValue: 'Updated Event' },
    ])
    await sendEventUpdatedEmail(baseEvent, updatedEvent)
    expect(mockDetectChanges).toHaveBeenCalledWith(baseEvent, updatedEvent)
  })

  it('calls generateEditEventEmail when changes are found', async () => {
    const changes = [{ field: 'title', oldValue: 'Test Event', newValue: 'Updated Event' }]
    mockDetectChanges.mockReturnValue(changes)
    await sendEventUpdatedEmail(baseEvent, updatedEvent)
    expect(mockGenerateEditEventEmail).toHaveBeenCalledWith(updatedEvent, changes)
  })

  it('calls sendMail with correct from/to/subject/html when changes found', async () => {
    mockDetectChanges.mockReturnValue([
      { field: 'title', oldValue: 'Test Event', newValue: 'Updated Event' },
    ])
    await sendEventUpdatedEmail(baseEvent, updatedEvent)
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'hit@zsb.os.de',
        to: 'hit@zsb.os.de',
        subject: 'HIT — Veranstaltung bearbeitet: Test Event',
        html: '<p>Edited event</p>',
      })
    )
  })

  it('skips email when no changes detected', async () => {
    mockDetectChanges.mockReturnValue([])
    await sendEventUpdatedEmail(baseEvent, updatedEvent)
    expect(mockSendMail).not.toHaveBeenCalled()
    expect(mockGenerateEditEventEmail).not.toHaveBeenCalled()
  })

  it('does not throw when SMTP is not configured', async () => {
    vi.stubEnv('SMTP_HOST', '')
    await expect(sendEventUpdatedEmail(baseEvent, updatedEvent)).resolves.toBeUndefined()
  })

  it('does not call sendMail when SMTP is not configured', async () => {
    vi.stubEnv('SMTP_HOST', '')
    await sendEventUpdatedEmail(baseEvent, updatedEvent)
    expect(mockSendMail).not.toHaveBeenCalled()
  })
})
