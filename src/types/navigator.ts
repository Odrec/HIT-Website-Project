// Navigator types for the Studiennavigator (model-driven recommendations)

import type { StudyProgram, Event } from './events'
import type { NavigatorOption } from '@/lib/navigator-reply'

export type { NavigatorOption }

export type NavigatorPhase = 'guided' | 'followup'

export interface StoredRecommendation {
  programs: { programId: string; reason: string }[]
  summary: string
}

export interface NavigatorSession {
  id: string
  startedAt: Date
  phase: NavigatorPhase
  messages: NavigatorMessage[]
  recommendation: StoredRecommendation | null
  crisisDetected: boolean
}

export interface NavigatorMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: MessageMetadata
}

export interface MessageMetadata {
  options?: NavigatorOption[]
  resources?: EndSessionResource[]
}

/** A recommended programme with the model's one-sentence reason. */
export interface ProgramRecommendation {
  program: StudyProgram
  reason: string
  isLehramt?: boolean
  relatedEvents?: Event[]
}

export interface NavigatorRecommendation {
  programs: ProgramRecommendation[]
  summary: string
}

export interface CrisisDetection {
  detected: boolean
  keywords: string[]
  severity: 'low' | 'medium' | 'high'
  resources: SupportResource[]
}

export interface SupportResource {
  name: string
  description: string
  phone?: string
  email?: string
  url?: string
  available: string
}

export interface EndSessionResource {
  type: ResourceType
  title: string
  description: string
  url?: string
  icon?: string
}

export type ResourceType =
  | 'counseling'
  | 'trial'
  | 'events'
  | 'aptitude_test'
  | 'information'
  | 'application'

export interface NavigatorMessageRequest {
  sessionId?: string
  message: string
}

export interface NavigatorMessageResponse {
  sessionId: string
  message: NavigatorMessage
  phase: NavigatorPhase
  recommendation?: NavigatorRecommendation
  crisis?: CrisisDetection
  model: string
}

export const CRISIS_SUPPORT_RESOURCES: SupportResource[] = [
  {
    name: 'Telefonseelsorge',
    description: 'Kostenlose und anonyme Beratung bei Krisen',
    phone: '0800 111 0 111',
    available: '24/7',
  },
  {
    name: 'Psychologische Beratung der Universität',
    description: 'Psychologische Beratungsstelle für Studierende',
    url: 'https://www.uni-osnabrueck.de/studium/studienberatung/psychologische-beratung/',
    email: 'psychberatung@uni-osnabrueck.de',
    available: 'Mo-Fr nach Vereinbarung',
  },
  {
    name: 'Studierendenwerk Psychosoziale Beratung',
    description: 'Unterstützung bei persönlichen Schwierigkeiten',
    url: 'https://www.studentenwerk-osnabrueck.de/de/beratung/psychosoziale-beratung.html',
    available: 'Mo-Fr 9-16 Uhr',
  },
]

export const END_SESSION_RESOURCES: EndSessionResource[] = [
  {
    type: 'counseling',
    title: 'Studienberatung',
    description: 'Persönliche Beratung zu Studienentscheidungen',
    url: 'https://www.uni-osnabrueck.de/studium/studienberatung/',
    icon: 'MessageCircle',
  },
  {
    type: 'trial',
    title: 'Schnupperstudium',
    description: 'Vorlesungen besuchen und Studienfächer erleben',
    url: 'https://www.uni-osnabrueck.de/studium/schnupperstudium/',
    icon: 'GraduationCap',
  },
  {
    type: 'events',
    title: 'Veranstaltungen',
    description: 'Passende Veranstaltungen am HIT besuchen',
    url: '/events',
    icon: 'Calendar',
  },
  {
    type: 'aptitude_test',
    title: 'Selbsttests',
    description: 'Eignungstests und Interessenfragebögen',
    url: 'https://www.uni-osnabrueck.de/studium/studienberatung/selbsttests/',
    icon: 'ClipboardCheck',
  },
]

export const CRISIS_KEYWORDS: string[] = [
  'selbstmord',
  'suizid',
  'umbringen',
  'sterben wollen',
  'nicht mehr leben',
  'keinen sinn',
  'hoffnungslos',
  'aufgeben',
  'depressiv',
  'depression',
  'verzweifelt',
  'einsam',
  'isoliert',
  'panik',
  'angst',
  'überwältigt',
  'überfordert',
  'burnout',
  'zusammenbruch',
]

export const CRISIS_HIGH_SEVERITY_KEYWORDS: string[] = [
  'selbstmord',
  'suizid',
  'umbringen',
  'sterben wollen',
  'nicht mehr leben',
]
