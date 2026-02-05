// Event form validation schema using Zod

import { z } from 'zod'

export const lecturerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().optional().default(''),
  email: z.string().email('Invalid email').optional().or(z.literal('')).default(''),
  building: z.string().optional().default(''),
  roomNumber: z.string().optional().default(''),
})

export const organizerSchema = z.object({
  email: z.string().email('Invalid email'),
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
    eventType: z.enum(['VORTRAG', 'LABORFUEHRUNG', 'RUNDGANG', 'WORKSHOP', 'LINK', 'INFOSTAND']),
    timeStart: z.date().optional().nullable(),
    timeEnd: z.date().optional().nullable(),
    locationType: z.enum(['INFOMARKT_SCHLOSS', 'INFOMARKT_CN', 'OTHER']),
    locationDetails: z.record(z.string(), z.unknown()).optional(),
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
    photoUrl: z.string().url('Invalid URL').optional().or(z.literal('')).default(''),
    institution: z.enum(['UNI', 'HOCHSCHULE', 'BOTH']),
    locationId: z.string().optional().default(''),
    lecturers: z.array(lecturerSchema).default([]),
    organizers: z.array(organizerSchema).default([]),
    studyProgramIds: z.array(z.string()).default([]),
    infoMarketIds: z.array(z.string()).default([]),
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
  locationType: 'OTHER',
  institution: 'BOTH',
  lecturers: [],
  organizers: [],
  studyProgramIds: [],
  infoMarketIds: [],
}

// Event type labels for display
export const eventTypeLabels: Record<string, string> = {
  VORTRAG: 'Vortrag',
  LABORFUEHRUNG: 'Laborführung',
  RUNDGANG: 'Rundgang',
  WORKSHOP: 'Workshop',
  LINK: 'Link',
  INFOSTAND: 'Infostand',
}

// Location type labels for display
export const locationTypeLabels: Record<string, string> = {
  INFOMARKT_SCHLOSS: 'Infomarkt Schloss',
  INFOMARKT_CN: 'Infomarkt CN',
  OTHER: 'Anderer Ort',
}

// Institution labels for display
export const institutionLabels: Record<string, string> = {
  UNI: 'Universität',
  HOCHSCHULE: 'Hochschule',
  BOTH: 'Beide',
}
