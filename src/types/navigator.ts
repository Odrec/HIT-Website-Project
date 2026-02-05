// Navigator types for Study Program Navigator

import type { StudyProgram, StudyProgramCluster, Event } from './events'

/**
 * Navigator session state
 */
export interface NavigatorSession {
  id: string
  startedAt: Date
  messages: NavigatorMessage[]
  recommendedPrograms: ProgramRecommendation[]
  askedQuestions: string[]
  crisisDetected: boolean
  completed: boolean
}

/**
 * Message in navigator conversation
 */
export interface NavigatorMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: MessageMetadata
}

/**
 * Metadata attached to messages
 */
export interface MessageMetadata {
  questionType?: QuestionType
  suggestedResponses?: string[]
  programs?: ProgramRecommendation[]
  crisisKeywords?: string[]
  resources?: EndSessionResource[]
}

/**
 * Types of questions the navigator can ask
 */
export type QuestionType =
  | 'interests' // General interests
  | 'skills' // Skills and abilities
  | 'career' // Career goals
  | 'institution' // Uni vs Hochschule preference
  | 'study_format' // Full-time, part-time, etc.
  | 'subjects' // Specific subject interests
  | 'lehramt' // Teacher training specific
  | 'clarification' // Follow-up clarification
  | 'confirmation' // Confirming understanding

/**
 * Recommended program with relevance score
 */
export interface ProgramRecommendation {
  program: StudyProgram
  relevanceScore: number // 0-100
  matchReasons: string[] // Why this program was recommended
  relatedEvents?: Event[] // Events for this program
}

/**
 * Cluster recommendation (groups of programs)
 */
export interface ClusterRecommendation {
  cluster: StudyProgramCluster
  programs: ProgramRecommendation[]
  averageScore: number
}

/**
 * Crisis keywords that trigger support resources
 */
export interface CrisisDetection {
  detected: boolean
  keywords: string[]
  severity: 'low' | 'medium' | 'high'
  resources: SupportResource[]
}

/**
 * Support resource for crisis situations
 */
export interface SupportResource {
  name: string
  description: string
  phone?: string
  email?: string
  url?: string
  available: string // e.g., "24/7" or "Mo-Fr 9-17"
}

/**
 * End of session resources
 */
export interface EndSessionResource {
  type: ResourceType
  title: string
  description: string
  url?: string
  icon?: string
}

/**
 * Types of end-session resources
 */
export type ResourceType =
  | 'counseling' // Studienberatung
  | 'trial' // Schnupperstudium
  | 'events' // Upcoming events
  | 'aptitude_test' // Eignungstests
  | 'information' // Additional info links
  | 'application' // Application info

/**
 * Navigator API request to send a message
 */
export interface NavigatorMessageRequest {
  sessionId?: string
  message: string
}

/**
 * Navigator API response
 */
export interface NavigatorMessageResponse {
  sessionId: string
  message: NavigatorMessage
  session: NavigatorSession
}

/**
 * Request to get program recommendations
 */
export interface RecommendationRequest {
  sessionId: string
  limit?: number
  includeEvents?: boolean
}

/**
 * Response with program recommendations
 */
export interface RecommendationResponse {
  programs: ProgramRecommendation[]
  clusters: ClusterRecommendation[]
  endSessionResources: EndSessionResource[]
}

/**
 * LLM prompt configuration
 */
export interface NavigatorPromptConfig {
  systemPrompt: string
  questionTemplates: Record<QuestionType, string[]>
  crisisKeywords: string[]
  maxQuestions: number
  minQuestionsBeforeRecommendation: number
}

/**
 * LLM completion request
 */
export interface LLMCompletionRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  maxTokens?: number
}

/**
 * LLM completion response
 */
export interface LLMCompletionResponse {
  content: string
  suggestedResponses?: string[]
  detectedIntents?: string[]
  recommendedPrograms?: string[] // Program IDs
  crisisKeywords?: string[]
}

/**
 * Navigator settings
 */
export interface NavigatorSettings {
  maxTurns: number
  showClusterRecommendations: boolean
  includeEventSuggestions: boolean
  enableCrisisDetection: boolean
  language: 'de' | 'en'
}

/**
 * Default navigator settings
 */
export const DEFAULT_NAVIGATOR_SETTINGS: NavigatorSettings = {
  maxTurns: 10,
  showClusterRecommendations: true,
  includeEventSuggestions: true,
  enableCrisisDetection: true,
  language: 'de',
}

/**
 * Crisis support resources (German)
 */
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

/**
 * End session resources (German)
 */
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
    description: 'Kommende Informationsveranstaltungen besuchen',
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
  {
    type: 'information',
    title: 'Studiengänge',
    description: 'Detaillierte Informationen zu allen Studiengängen',
    url: 'https://www.uni-osnabrueck.de/studium/studiengaenge/',
    icon: 'BookOpen',
  },
  {
    type: 'application',
    title: 'Bewerbung',
    description: 'Informationen zur Bewerbung und Einschreibung',
    url: 'https://www.uni-osnabrueck.de/studium/bewerbung/',
    icon: 'FileText',
  },
]

/**
 * Crisis detection keywords (German)
 */
export const CRISIS_KEYWORDS: string[] = [
  // Self-harm related
  'selbstmord',
  'suizid',
  'umbringen',
  'sterben wollen',
  'nicht mehr leben',
  'keinen sinn',
  'hoffnungslos',
  'aufgeben',
  // Depression related
  'depressiv',
  'depression',
  'verzweifelt',
  'einsam',
  'isoliert',
  // Anxiety related
  'panik',
  'angst',
  'überwältigt',
  // Stress related
  'überfordert',
  'burnout',
  'zusammenbruch',
]
