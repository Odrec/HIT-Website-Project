import { z } from 'zod'

export const affiliationValues = ['UNI', 'HOCHSCHULE', 'BEIDE', 'EXTERN'] as const

export const melderFormSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich').max(200),
  lastName: z.string().min(1, 'Nachname ist erforderlich').max(200),
  title: z.string().max(100).optional().or(z.literal('')),
  email: z.email('Ungültige E-Mail-Adresse'),
  phone: z.string().max(50).optional().or(z.literal('')),
  affiliation: z.enum(affiliationValues, {
    message: 'Zugehörigkeit ist erforderlich',
  }),
  organisationseinheit: z.string().max(200).optional().or(z.literal('')),
  room: z.string().max(100).optional().or(z.literal('')),
  adresse: z.string().max(300).optional().or(z.literal('')),
})

export type MelderFormData = z.infer<typeof melderFormSchema>

export const affiliationLabels: Record<string, string> = {
  UNI: 'Universität',
  HOCHSCHULE: 'Hochschule',
  BEIDE: 'Beide',
  EXTERN: 'Extern',
}

/**
 * Label for the single organizational-unit field, which depends on the
 * selected affiliation: Fakultät at the Hochschule, Fachbereich at the
 * Universität, Institution otherwise.
 */
export function organisationseinheitLabel(affiliation: string): string {
  switch (affiliation) {
    case 'HOCHSCHULE':
      return 'Fakultät / Institution'
    case 'UNI':
      return 'Fachbereich / Institution'
    default:
      return 'Institution'
  }
}
