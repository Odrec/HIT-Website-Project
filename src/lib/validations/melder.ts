import { z } from 'zod'

export const affiliationValues = ['UNI', 'HOCHSCHULE', 'BEIDE', 'EXTERN'] as const

export const melderFormSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  title: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().max(50).optional().or(z.literal('')),
  affiliation: z.enum(affiliationValues, {
    message: 'Zugehörigkeit ist erforderlich',
  }),
  fakultaet: z.string().max(200).optional().or(z.literal('')),
  fachbereich: z.string().max(200).optional().or(z.literal('')),
  room: z.string().max(100).optional().or(z.literal('')),
})

export type MelderFormData = z.infer<typeof melderFormSchema>

export const affiliationLabels: Record<string, string> = {
  UNI: 'Universität Osnabrück',
  HOCHSCHULE: 'Hochschule Osnabrück',
  BEIDE: 'Beide',
  EXTERN: 'Extern',
}
