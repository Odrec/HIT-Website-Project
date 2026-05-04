// Event form validation schema using Zod

import { z } from 'zod'
import { affiliationValues } from './melder'

// Vorname is required for the first lecturer (refined below at the array
// level). For additional entries it may be left blank — the Nachname field
// commonly carries a group label like "Mitarbeitende" or "Studierende".
export const lecturerSchema = z.object({
  firstName: z.string().default(''),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().optional().default(''),
  email: z.email('Invalid email').optional().or(z.literal('')).default(''),
  affiliation: z.enum(affiliationValues).optional().or(z.literal('')),
})

export const lecturerArraySchema = z
  .array(lecturerSchema)
  .default([])
  .superRefine((lecturers, ctx) => {
    if (lecturers.length > 0 && lecturers[0].firstName.trim().length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Vorname ist für die erste dozierende Person erforderlich',
        path: [0, 'firstName'],
      })
    }
  })

export const organizerSchema = z.object({
  email: z.email('Invalid email'),
  phone: z.string().optional().default(''),
  internalOnly: z.boolean().default(true),
})

export const eventFormSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be less than 200 characters'),
    description: z
      .string()
      .max(5000, 'Description must be less than 5000 characters')
      .optional()
      .default(''),
    eventType: z.enum([
      'VORTRAG',
      'LABORFUEHRUNG',
      'RUNDGANG',
      'WORKSHOP',
      'ONLINE',
      'VIDEO',
      'INFOSTAND',
    ]),
    timeStart: z.date().optional().nullable(),
    timeEnd: z.date().optional().nullable(),
    locationDetails: z.record(z.string(), z.unknown()).optional(),
    locationMode: z.enum(['CONFIRMED', 'WISH']).default('CONFIRMED'),
    locationWishArea: z.enum(['WESTERBERG', 'CAPRIVI', 'INNENSTADT']).optional().or(z.literal('')),
    roomRequest: z
      .string()
      .max(500, 'Room request must be less than 500 characters')
      .optional()
      .default(''),
    meetingPoint: z
      .string()
      .max(500, 'Meeting point must be less than 500 characters')
      .optional()
      .default(''),
    additionalInfo: z
      .string()
      .max(2000, 'Additional info must be less than 2000 characters')
      .optional()
      .default(''),
    photoUrl: z.url('Invalid URL').optional().or(z.literal('')).default(''),
    institution: z.enum(['UNI', 'HOCHSCHULE', 'BOTH']),
    lecturers: lecturerArraySchema,
    organizers: z.array(organizerSchema).default([]),
    studyProgramIds: z.array(z.string()).default([]),
    infoMarketIds: z.array(z.string()).default([]),
    isCrossProgram: z.boolean().default(false),
    locationHint: z.string().max(500).optional().or(z.literal('')),
    buildingId: z.string().optional().or(z.literal('')),
    roomId: z.string().optional().or(z.literal('')),
    melderId: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      // If event has a time start and time end, end should be after start
      if (data.timeStart && data.timeEnd) {
        return data.timeEnd > data.timeStart
      }
      return true
    },
    {
      message: 'End time must be after start time',
      path: ['timeEnd'],
    }
  )

export type EventFormValues = z.infer<typeof eventFormSchema>

// Default values for new event form
export const defaultEventValues: Partial<EventFormValues> = {
  title: '',
  description: '',
  eventType: 'VORTRAG',
  timeStart: null,
  timeEnd: null,
  locationMode: 'CONFIRMED',
  institution: 'BOTH',
  lecturers: [],
  organizers: [],
  studyProgramIds: [],
  infoMarketIds: [],
  isCrossProgram: false,
  locationHint: '',
  buildingId: '',
  roomId: '',
}

// Event type labels for display
export const eventTypeLabels: Record<string, string> = {
  VORTRAG: 'Vortrag',
  LABORFUEHRUNG: 'Laborführung',
  RUNDGANG: 'Rundgang',
  WORKSHOP: 'Workshop',
  ONLINE: 'Online',
  VIDEO: 'Video',
  INFOSTAND: 'Infostand',
}

// Institution labels for display
export const institutionLabels: Record<string, string> = {
  UNI: 'Universität',
  HOCHSCHULE: 'Hochschule',
  BOTH: 'Beide',
}
