import { z } from 'zod'

export const buildingFormSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  address: z.string().max(500).optional().or(z.literal('')),
  campus: z.string().max(200).optional().or(z.literal('')),
})

export type BuildingFormData = z.infer<typeof buildingFormSchema>

export const roomFormSchema = z.object({
  name: z.string().min(1, 'Name/Nummer ist erforderlich').max(100),
  floor: z.string().max(50).optional().or(z.literal('')),
})

export type RoomFormData = z.infer<typeof roomFormSchema>
