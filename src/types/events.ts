// Event-related TypeScript types

export enum Institution {
  UNI = 'UNI',
  HOCHSCHULE = 'HOCHSCHULE',
  BOTH = 'BOTH',
}

export enum EventType {
  VORTRAG = 'VORTRAG',
  LABORFUEHRUNG = 'LABORFUEHRUNG',
  RUNDGANG = 'RUNDGANG',
  WORKSHOP = 'WORKSHOP',
  LINK = 'LINK',
  INFOSTAND = 'INFOSTAND',
}

export enum LocationType {
  INFOMARKT_SCHLOSS = 'INFOMARKT_SCHLOSS',
  INFOMARKT_CN = 'INFOMARKT_CN',
  OTHER = 'OTHER',
}

export interface Lecturer {
  id: string
  eventId: string
  firstName: string
  lastName: string
  title?: string
  email?: string
  building?: string
  roomNumber?: string
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
  clusterId?: string
  cluster?: StudyProgramCluster
}

export interface StudyProgramCluster {
  id: string
  name: string
  description?: string
  programs?: StudyProgram[]
}

export interface Location {
  id: string
  buildingName: string
  roomNumber?: string
  address?: string
  latitude?: number
  longitude?: number
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
  locationType: LocationType
  locationDetails?: Record<string, unknown>
  roomRequest?: string
  meetingPoint?: string
  additionalInfo?: string
  photoUrl?: string
  institution: Institution
  locationId?: string
  location?: Location
  lecturers?: Lecturer[]
  organizers?: EventOrganizer[]
  studyPrograms?: StudyProgram[]
  infoMarkets?: InformationMarket[]
  createdAt: Date
  updatedAt: Date
}

// Form types for creating/editing events
export interface CreateEventInput {
  title: string
  description?: string
  eventType: EventType
  timeStart?: Date
  timeEnd?: Date
  locationType: LocationType
  locationDetails?: Record<string, unknown>
  roomRequest?: string
  meetingPoint?: string
  additionalInfo?: string
  photoUrl?: string
  institution: Institution
  locationId?: string
  lecturers?: Omit<Lecturer, 'id' | 'eventId'>[]
  organizers?: Omit<EventOrganizer, 'id' | 'eventId'>[]
  studyProgramIds?: string[]
  infoMarketIds?: string[]
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string
}

// Filter types for event queries
export interface EventFilters {
  institution?: Institution
  eventType?: EventType
  studyProgramId?: string
  clusterId?: string
  locationId?: string
  startDate?: Date
  endDate?: Date
  search?: string
}

export interface EventSortOptions {
  field: 'title' | 'timeStart' | 'institution' | 'eventType' | 'createdAt'
  direction: 'asc' | 'desc'
}
