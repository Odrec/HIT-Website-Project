// Event-related TypeScript types

export enum Institution {
  UNI = 'UNI',
  HOCHSCHULE = 'HOCHSCHULE',
  BOTH = 'BOTH',
}

export enum Affiliation {
  UNI = 'UNI',
  HOCHSCHULE = 'HOCHSCHULE',
  BEIDE = 'BEIDE',
  EXTERN = 'EXTERN',
}

export enum EventType {
  VORTRAG = 'VORTRAG',
  LABORFUEHRUNG = 'LABORFUEHRUNG',
  RUNDGANG = 'RUNDGANG',
  WORKSHOP = 'WORKSHOP',
  ONLINE = 'ONLINE',
  VIDEO = 'VIDEO',
  INFOSTAND = 'INFOSTAND',
}

export interface Melder {
  id: string
  userId: string
  firstName: string
  lastName: string
  title: string | null
  email: string
  phone: string | null
  affiliation: Affiliation
  fakultaet: string | null
  fachbereich: string | null
  room: string | null
}

export interface Building {
  id: string
  slug: string
  name: string
  shortName: string | null
  address: string | null
  campus: string | null
  latitude: number | null
  longitude: number | null
  hasAccessibility: boolean
  accessibilityNotes: string | null
  rooms?: Room[]
}

export interface Room {
  id: string
  name: string
  floor: string | null
  buildingId: string
  building?: Building
}

export interface Lecturer {
  id: string
  eventId: string
  firstName: string
  lastName: string
  title?: string
  email?: string
  affiliation?: Affiliation
}

export interface EventOrganizer {
  id: string
  eventId: string
  email: string
  phone?: string
  internalOnly: boolean
}

export interface StudyProgram {
  id: string
  name: string
  institution: Institution
  clusters?: StudyProgramCluster[]
}

export interface StudyProgramCluster {
  id: string
  name: string
  description?: string
  programs?: StudyProgram[]
}

export interface InformationMarket {
  id: string
  name: string
  location: string
}

export interface Event {
  id: string
  title: string
  description?: string
  eventType: EventType
  timeStart?: Date
  timeEnd?: Date
  locationDetails?: Record<string, unknown>
  roomRequest?: string
  meetingPoint?: string
  additionalInfo?: string
  photoUrl?: string
  institution: Institution
  isCrossProgram?: boolean
  locationHint?: string | null
  melderId?: string | null
  melder?: Melder | null
  buildingId?: string | null
  building?: Building | null
  roomId?: string | null
  room?: Room | null
  lecturers?: Lecturer[]
  organizers?: EventOrganizer[]
  studyPrograms?: StudyProgram[]
  infoMarkets?: InformationMarket[]
  createdAt: Date
  updatedAt: Date
}

// Form types for creating/editing events
export type LocationMode = 'CONFIRMED' | 'WISH'
/** String literal codes for the three HIT campus areas used in the event
 *  form's Wunsch flow. Named with a Code suffix to avoid colliding with
 *  the geographic CampusArea interface in types/routes.ts. */
export type CampusAreaCode = 'WESTERBERG' | 'CAPRIVI' | 'INNENSTADT'

export interface CreateEventInput {
  title: string
  description?: string
  eventType: EventType
  timeStart?: Date
  timeEnd?: Date
  locationDetails?: Record<string, unknown>
  locationMode?: LocationMode
  locationWishArea?: CampusAreaCode | null
  roomRequest?: string
  meetingPoint?: string
  additionalInfo?: string
  photoUrl?: string
  institution: Institution
  isCrossProgram?: boolean
  locationHint?: string
  melderId?: string
  buildingId?: string
  roomId?: string
  lecturers?: Omit<Lecturer, 'id' | 'eventId'>[]
  organizers?: Omit<EventOrganizer, 'id' | 'eventId'>[]
  studyProgramIds?: string[]
  infoMarketIds?: string[]
}

export type EventReviewStatus = 'DRAFT_FROM_ROLLOVER' | 'NEEDS_REVIEW' | 'PUBLISHED'

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string
  reviewStatus?: EventReviewStatus
}

// Filter types for event queries
export interface EventFilters {
  institution?: Institution
  eventType?: EventType
  studyProgramId?: string
  clusterId?: string
  buildingId?: string
  startDate?: Date
  endDate?: Date
  search?: string
  isCrossProgram?: boolean
  melderId?: string
  reviewStatus?: EventReviewStatus
}

export interface EventSortOptions {
  field: 'title' | 'timeStart' | 'institution' | 'eventType' | 'createdAt'
  direction: 'asc' | 'desc'
}
