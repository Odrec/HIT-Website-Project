// Navigator Service - AI-powered study program navigation

import { prisma } from '@/lib/db/prisma'
import type {
  NavigatorSession,
  NavigatorMessage,
  ProgramRecommendation,
  ClusterRecommendation,
  CrisisDetection,
  LLMCompletionRequest,
  LLMCompletionResponse,
  QuestionType,
  EndSessionResource,
} from '@/types/navigator'
import { Institution, EventType, LocationType } from '@/types/events'
import type { StudyProgram, Event } from '@/types/events'

// In-memory session store (in production, use Redis)
// Use globalThis to persist sessions across Next.js hot-reloads in development
const globalForSessions = globalThis as unknown as {
  navigatorSessions: Map<string, NavigatorSession> | undefined
}

const sessions = globalForSessions.navigatorSessions ?? new Map<string, NavigatorSession>()

if (process.env.NODE_ENV !== 'production') {
  globalForSessions.navigatorSessions = sessions
}

/**
 * System prompt for the study program navigator
 */
const SYSTEM_PROMPT = `Du bist ein freundlicher Studienberater für Uni und Hochschule Osnabrück.

REGELN:
1. Maximal 1-2 Fragen pro Nachricht
2. Beziehe dich auf vorherige Antworten
3. Nach 4-5 Fragen: Fasse zusammen und beende

Antworte auf Deutsch als normaler Text (KEIN JSON). Sei freundlich und kurz.`

/**
 * Question templates for variety
 */
const QUESTION_TEMPLATES: Record<QuestionType, string[]> = {
  interests: [
    'Was interessiert dich besonders? Welche Themen begeistern dich?',
    'Womit beschäftigst du dich gerne in deiner Freizeit?',
    'Welche Schulfächer haben dir am meisten Spaß gemacht?',
  ],
  skills: [
    'Wo liegen deine Stärken? Was kannst du besonders gut?',
    'Arbeitest du lieber praktisch oder theoretisch?',
    'Magst du eher analytische Aufgaben oder kreative Projekte?',
  ],
  career: [
    'Hast du schon Vorstellungen, was du später beruflich machen möchtest?',
    'In welchem Bereich siehst du dich nach dem Studium arbeiten?',
    'Ist dir ein sicherer Beruf wichtiger oder die Selbstverwirklichung?',
  ],
  institution: [
    'Weißt du schon, ob du eher an einer Universität oder Hochschule studieren möchtest?',
    'Bevorzugst du einen stärker forschungsorientierten (Uni) oder praxisnahen (Hochschule) Ansatz?',
  ],
  study_format: [
    'Möchtest du in Vollzeit studieren oder bevorzugst du ein Teilzeit-/duales Studium?',
    'Ist dir wichtig, während des Studiums bereits praktische Erfahrung zu sammeln?',
  ],
  subjects: [
    'Gibt es bestimmte Fachrichtungen, die dich besonders ansprechen?',
    'Interessierst du dich eher für Naturwissenschaften, Geisteswissenschaften oder Wirtschaft?',
  ],
  lehramt: [
    'Möchtest du später an Grundschulen, Haupt-/Realschulen oder Gymnasien unterrichten?',
    'Welche Fächerkombination könntest du dir für das Lehramt vorstellen?',
  ],
  clarification: [
    'Kannst du mir mehr darüber erzählen?',
    'Was genau meinst du damit?',
  ],
  confirmation: [
    'Habe ich das richtig verstanden, dass...?',
    'Zusammenfassend interessierst du dich also für...?',
  ],
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `nav-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Create a new navigator session
 */
export function createSession(): NavigatorSession {
  const session: NavigatorSession = {
    id: generateSessionId(),
    startedAt: new Date(),
    messages: [],
    recommendedPrograms: [],
    askedQuestions: [],
    crisisDetected: false,
    completed: false,
  }
  sessions.set(session.id, session)
  return session
}

/**
 * Get an existing session
 */
export function getSession(sessionId: string): NavigatorSession | undefined {
  return sessions.get(sessionId)
}

/**
 * Check for crisis keywords in user message
 */
export function detectCrisis(message: string): CrisisDetection {
  const lowerMessage = message.toLowerCase()
  const detectedKeywords: string[] = []
  
  // Import crisis keywords
  const crisisKeywords = [
    'selbstmord', 'suizid', 'umbringen', 'sterben wollen', 'nicht mehr leben',
    'keinen sinn', 'hoffnungslos', 'aufgeben', 'depressiv', 'depression',
    'verzweifelt', 'einsam', 'isoliert', 'panik', 'angst', 'überwältigt',
    'überfordert', 'burnout', 'zusammenbruch'
  ]
  
  for (const keyword of crisisKeywords) {
    if (lowerMessage.includes(keyword)) {
      detectedKeywords.push(keyword)
    }
  }
  
  if (detectedKeywords.length === 0) {
    return { detected: false, keywords: [], severity: 'low', resources: [] }
  }
  
  // Determine severity
  const highSeverityWords = ['selbstmord', 'suizid', 'umbringen', 'sterben wollen', 'nicht mehr leben']
  const hasHighSeverity = detectedKeywords.some(k => highSeverityWords.includes(k))
  
  const severity = hasHighSeverity ? 'high' : detectedKeywords.length > 2 ? 'medium' : 'low'
  
  return {
    detected: true,
    keywords: detectedKeywords,
    severity,
    resources: [
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
    ],
  }
}

/**
 * Call the LLM API - supports Google Gemini and OpenAI
 * Priority: OPENAI_API_KEY > GOOGLE_AI_API_KEY > fallback
 */
async function callLLM(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
  const openaiApiKey = process.env.OPENAI_API_KEY
  const googleApiKey = process.env.GOOGLE_AI_API_KEY
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  
  // Try OpenAI first if available
  if (openaiApiKey) {
    return callOpenAI(request, openaiApiKey, openaiModel)
  }
  
  // Fall back to Google Gemini
  if (googleApiKey) {
    return callGemini(request, googleApiKey)
  }
  
  console.warn('No AI API key configured (OPENAI_API_KEY or GOOGLE_AI_API_KEY), using fallback responses')
  return getFallbackResponse(request)
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  request: LLMCompletionRequest,
  apiKey: string,
  model: string
): Promise<LLMCompletionResponse> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1024,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text())
      return getFallbackResponse(request)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    return parseAIResponse(content)
  } catch (error) {
    console.error('OpenAI API call failed:', error)
    return getFallbackResponse(request)
  }
}

/**
 * Call Google Gemini API
 */
async function callGemini(
  request: LLMCompletionRequest,
  apiKey: string
): Promise<LLMCompletionResponse> {
  const model = process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash'
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: request.messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : m.role,
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens ?? 1024,
          },
        }),
      }
    )

    if (!response.ok) {
      console.error('Gemini API error:', await response.text())
      return getFallbackResponse(request)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return parseAIResponse(content)
  } catch (error) {
    console.error('Gemini API call failed:', error)
    return getFallbackResponse(request)
  }
}

/**
 * Parse AI response and extract structured data
 */
function parseAIResponse(content: string): LLMCompletionResponse & { shouldEndSession?: boolean; summary?: string } {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        content: parsed.message || content,
        suggestedResponses: parsed.suggestedResponses,
        detectedIntents: parsed.questionType ? [parsed.questionType] : undefined,
        recommendedPrograms: parsed.recommendedProgramIds,
        crisisKeywords: undefined,
        shouldEndSession: parsed.shouldEndSession,
        summary: parsed.summary,
      }
    }
  } catch {
    // If JSON parsing fails, return raw content
  }

  return { content }
}

/**
 * Fallback response when LLM is not available
 */
function getFallbackResponse(request: LLMCompletionRequest): LLMCompletionResponse {
  const messageCount = request.messages.filter(m => m.role === 'user').length
  
  const questions = [
    {
      message: 'Willkommen beim Studiennavigator! Was interessiert dich besonders? Welche Themen oder Fächer faszinieren dich?',
      suggestions: ['Naturwissenschaften und Technik', 'Sprachen und Kultur', 'Wirtschaft und Management', 'Soziales und Gesundheit'],
    },
    {
      message: 'Das ist interessant! Arbeitest du lieber praktisch mit konkreten Projekten oder beschäftigst du dich gerne mit theoretischen Konzepten?',
      suggestions: ['Praktisch - ich will direkt anwenden', 'Theoretisch - ich will verstehen warum', 'Eine Mischung aus beidem'],
    },
    {
      message: 'Gut zu wissen! Hast du schon eine Vorstellung, in welchem Bereich du später arbeiten möchtest?',
      suggestions: ['In der Forschung', 'In einem Unternehmen', 'Im öffentlichen Dienst', 'Selbstständig', 'Noch keine Ahnung'],
    },
    {
      message: 'Möchtest du lieber an einer Universität oder einer Hochschule studieren? Die Uni ist forschungsorientierter, die Hochschule praxisnäher.',
      suggestions: ['Universität', 'Hochschule', 'Das ist mir egal', 'Erkläre mir den Unterschied genauer'],
    },
    {
      message: 'Basierend auf deinen Antworten kann ich dir einige Studiengänge empfehlen. Schau sie dir an und klicke auf die Veranstaltungen, die dich interessieren!',
      suggestions: ['Zeige mir die Empfehlungen', 'Ich habe noch mehr Fragen', 'Starte nochmal von vorne'],
    },
  ]
  
  const idx = Math.min(messageCount, questions.length - 1)
  const question = questions[idx]
  
  return {
    content: question.message,
    suggestedResponses: question.suggestions,
  }
}

/**
 * Process a user message and generate a response
 */
export async function processMessage(
  sessionId: string,
  userMessage: string
): Promise<{
  session: NavigatorSession
  response: NavigatorMessage
  crisis?: CrisisDetection
}> {
  let session = sessions.get(sessionId)
  
  if (!session) {
    session = createSession()
    session.id = sessionId
    sessions.set(sessionId, session)
  }
  
  // Check for crisis keywords
  const crisis = detectCrisis(userMessage)
  if (crisis.detected) {
    session.crisisDetected = true
  }
  
  // Add user message to session
  const userMsg: NavigatorMessage = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  }
  session.messages.push(userMsg)
  
  // If crisis detected, provide support resources
  if (crisis.detected && crisis.severity === 'high') {
    const supportMessage: NavigatorMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: `Es tut mir leid zu hören, dass du dich so fühlst. Deine Gefühle sind wichtig und es gibt Menschen, die dir helfen können.

Die Telefonseelsorge ist rund um die Uhr erreichbar unter 0800 111 0 111 (kostenlos und anonym).

Wenn du möchtest, können wir auch weiter über Studiengänge sprechen - aber dein Wohlbefinden hat Priorität.`,
      timestamp: new Date(),
      metadata: {
        resources: crisis.resources.map(r => ({
          type: 'counseling' as const,
          title: r.name,
          description: r.description,
          url: r.url,
        })),
      },
    }
    session.messages.push(supportMessage)
    sessions.set(sessionId, session)
    
    return { session, response: supportMessage, crisis }
  }
  
  // Count exchanges (user messages)
  const userMessageCount = session.messages.filter(m => m.role === 'user').length
  
  // Build conversation history for LLM with context
  const contextInfo = `

AKTUELLER STATUS:
- Anzahl bisheriger Austausche: ${userMessageCount}
- ${userMessageCount >= 4 ? 'WICHTIG: Du hast genug Informationen! Fasse zusammen und beende bald das Gespräch.' : 'Stelle noch Fragen um mehr zu erfahren.'}
- ${userMessageCount >= 5 ? 'JETZT das Gespräch beenden mit shouldEndSession: true!' : ''}

Bisherige Antworten des Users:
${session.messages.filter(m => m.role === 'user').map((m, i) => `${i + 1}. "${m.content}"`).join('\n')}
`
  
  const llmMessages = [
    { role: 'system' as const, content: SYSTEM_PROMPT + contextInfo },
    ...session.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]
  
  // Call LLM
  const llmResponse = await callLLM({
    messages: llmMessages,
    temperature: 0.7,
    maxTokens: 1024,
  })
  
  // Create assistant message
  const assistantMsg: NavigatorMessage = {
    id: `msg-${Date.now() + 1}`,
    role: 'assistant',
    content: llmResponse.content,
    timestamp: new Date(),
    metadata: {
      suggestedResponses: llmResponse.suggestedResponses,
      questionType: llmResponse.detectedIntents?.[0] as QuestionType | undefined,
    },
  }
  
  session.messages.push(assistantMsg)
  
  // Track asked question type
  if (llmResponse.detectedIntents?.[0]) {
    session.askedQuestions.push(llmResponse.detectedIntents[0])
  }
  
  // Check if session should end - either from LLM or after 5+ user messages
  const extendedResponse = llmResponse as LLMCompletionResponse & { shouldEndSession?: boolean }
  if (extendedResponse.shouldEndSession || userMessageCount >= 5 || session.messages.length >= 12) {
    session.completed = true
  }
  
  sessions.set(sessionId, session)
  
  return { session, response: assistantMsg, crisis: crisis.detected ? crisis : undefined }
}

/**
 * Get program recommendations based on session
 */
export async function getRecommendations(
  sessionId: string,
  limit: number = 10
): Promise<{
  programs: ProgramRecommendation[]
  clusters: ClusterRecommendation[]
  endResources: EndSessionResource[]
}> {
  const session = sessions.get(sessionId)
  
  // Extract keywords from conversation
  const conversationText = session?.messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ')
    .toLowerCase() || ''
  
  // Get all programs from database
  const programs = await prisma.studyProgram.findMany({
    include: {
      cluster: true,
      events: {
        include: {
          event: {
            include: {
              location: true,
              lecturers: true,
            },
          },
        },
      },
    },
  })
  
  // Score programs based on keyword matching
  const scoredPrograms = programs.map(program => {
    let score = 50 // Base score
    const reasons: string[] = []
    
    // Check for keyword matches
    const programName = program.name.toLowerCase()
    const clusterName = program.cluster?.name?.toLowerCase() || ''
    
    // Interest matching
    if (conversationText.includes('technik') && (programName.includes('technik') || programName.includes('ingenieur'))) {
      score += 20
      reasons.push('Passt zu deinem Interesse an Technik')
    }
    if (conversationText.includes('naturwissenschaft') && (programName.includes('physik') || programName.includes('chemie') || programName.includes('biologie'))) {
      score += 20
      reasons.push('Naturwissenschaftlicher Studiengang')
    }
    if (conversationText.includes('wirtschaft') && (programName.includes('wirtschaft') || programName.includes('bwl') || programName.includes('management'))) {
      score += 20
      reasons.push('Wirtschaftlicher Schwerpunkt')
    }
    if (conversationText.includes('sozial') && (programName.includes('sozial') || programName.includes('pädagogik') || programName.includes('psychologie'))) {
      score += 20
      reasons.push('Sozialwissenschaftlicher Fokus')
    }
    if (conversationText.includes('sprache') && (programName.includes('sprach') || programName.includes('germanistik') || programName.includes('anglistik'))) {
      score += 20
      reasons.push('Sprachwissenschaftlicher Studiengang')
    }
    if (conversationText.includes('informatik') && (programName.includes('informatik') || programName.includes('software') || programName.includes('computer'))) {
      score += 25
      reasons.push('Informatik-Studiengang')
    }
    if (conversationText.includes('lehramt') && programName.includes('lehramt')) {
      score += 30
      reasons.push('Lehramtsstudiengang')
    }
    
    // Institution preference - check for full names and abbreviations
    const wantsUni = conversationText.includes('universität') ||
                     /\buni\b/.test(conversationText) ||
                     conversationText.includes('uos')
    const wantsHS = conversationText.includes('hochschule') ||
                    /\bhs\b/.test(conversationText) ||
                    conversationText.includes('osnabrück hochschule')
    
    if (wantsUni && program.institution === 'UNI') {
      score += 15
      reasons.push('An der Universität (deine Präferenz)')
    }
    if (wantsHS && program.institution === 'HOCHSCHULE') {
      score += 15
      reasons.push('An der Hochschule (deine Präferenz)')
    }
    // Slight penalty if user expressed a preference for the other institution
    if (wantsUni && !wantsHS && program.institution === 'HOCHSCHULE') {
      score -= 5
    }
    if (wantsHS && !wantsUni && program.institution === 'UNI') {
      score -= 5
    }
    
    // Practical vs theoretical preference
    if (conversationText.includes('praktisch') && program.institution === 'HOCHSCHULE') {
      score += 10
      reasons.push('Praxisorientiertes Studium')
    }
    if (conversationText.includes('forschung') && program.institution === 'UNI') {
      score += 10
      reasons.push('Forschungsorientiertes Studium')
    }
    
    // Add some randomness to avoid identical results
    score += Math.random() * 5
    
    if (reasons.length === 0) {
      reasons.push('Könnte zu deinen Interessen passen')
    }
    
    // Map events
    const relatedEvents: Event[] = program.events.map(ep => ({
      id: ep.event.id,
      title: ep.event.title,
      description: ep.event.description || undefined,
      eventType: ep.event.eventType as unknown as EventType,
      timeStart: ep.event.timeStart ? new Date(ep.event.timeStart) : undefined,
      timeEnd: ep.event.timeEnd ? new Date(ep.event.timeEnd) : undefined,
      locationType: ep.event.locationType as unknown as LocationType,
      locationDetails: ep.event.locationDetails as Record<string, unknown> | undefined,
      roomRequest: ep.event.roomRequest || undefined,
      meetingPoint: ep.event.meetingPoint || undefined,
      additionalInfo: ep.event.additionalInfo || undefined,
      photoUrl: ep.event.photoUrl || undefined,
      institution: ep.event.institution as unknown as Institution,
      locationId: ep.event.locationId || undefined,
      location: ep.event.location ? {
        id: ep.event.location.id,
        buildingName: ep.event.location.buildingName,
        roomNumber: ep.event.location.roomNumber || undefined,
        address: ep.event.location.address || undefined,
        latitude: ep.event.location.latitude || undefined,
        longitude: ep.event.location.longitude || undefined,
      } : undefined,
      createdAt: new Date(ep.event.createdAt),
      updatedAt: new Date(ep.event.updatedAt),
    }))

    const mappedProgram: StudyProgram = {
      id: program.id,
      name: program.name,
      institution: program.institution as unknown as Institution,
      clusterId: program.clusterId || undefined,
      cluster: program.cluster ? {
        id: program.cluster.id,
        name: program.cluster.name,
        description: program.cluster.description || undefined,
      } : undefined,
    }

    return {
      program: mappedProgram,
      relevanceScore: Math.min(100, score),
      matchReasons: reasons,
      relatedEvents,
    } as ProgramRecommendation
  })
  
  // Sort by score and limit
  scoredPrograms.sort((a, b) => b.relevanceScore - a.relevanceScore)
  const topPrograms = scoredPrograms.slice(0, limit)
  
  // Group by cluster
  const clusterMap: Record<string, ProgramRecommendation[]> = {}
  for (const prog of topPrograms) {
    if (prog.program.clusterId) {
      if (!clusterMap[prog.program.clusterId]) {
        clusterMap[prog.program.clusterId] = []
      }
      clusterMap[prog.program.clusterId].push(prog)
    }
  }

  const clusters: ClusterRecommendation[] = []
  for (const clusterId of Object.keys(clusterMap)) {
    const progs = clusterMap[clusterId]
    const cluster = progs[0].program.cluster
    if (cluster) {
      clusters.push({
        cluster,
        programs: progs,
        averageScore: progs.reduce((acc: number, p: ProgramRecommendation) => acc + p.relevanceScore, 0) / progs.length,
      })
    }
  }
  clusters.sort((a, b) => b.averageScore - a.averageScore)
  
  // End session resources
  const endResources: EndSessionResource[] = [
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
  ]
  
  return { programs: topPrograms, clusters, endResources }
}

/**
 * Get events for recommended programs
 */
export async function getEventsForPrograms(programIds: string[]): Promise<Event[]> {
  const events = await prisma.event.findMany({
    where: {
      studyPrograms: {
        some: {
          studyProgramId: {
            in: programIds,
          },
        },
      },
    },
    include: {
      location: true,
      lecturers: true,
      studyPrograms: {
        include: {
          studyProgram: true,
        },
      },
    },
    orderBy: {
      timeStart: 'asc',
    },
  })
  
  return events.map((e): Event => ({
    id: e.id,
    title: e.title,
    description: e.description || undefined,
    eventType: e.eventType as unknown as EventType,
    timeStart: e.timeStart ? new Date(e.timeStart) : undefined,
    timeEnd: e.timeEnd ? new Date(e.timeEnd) : undefined,
    locationType: e.locationType as unknown as LocationType,
    locationDetails: e.locationDetails as Record<string, unknown> | undefined,
    roomRequest: e.roomRequest || undefined,
    meetingPoint: e.meetingPoint || undefined,
    additionalInfo: e.additionalInfo || undefined,
    photoUrl: e.photoUrl || undefined,
    institution: e.institution as unknown as Institution,
    locationId: e.locationId || undefined,
    location: e.location ? {
      id: e.location.id,
      buildingName: e.location.buildingName,
      roomNumber: e.location.roomNumber || undefined,
      address: e.location.address || undefined,
      latitude: e.location.latitude || undefined,
      longitude: e.location.longitude || undefined,
    } : undefined,
    lecturers: e.lecturers.map(l => ({
      id: l.id,
      eventId: l.eventId,
      firstName: l.firstName,
      lastName: l.lastName,
      title: l.title || undefined,
      email: l.email || undefined,
      building: l.building || undefined,
      roomNumber: l.roomNumber || undefined,
    })),
    studyPrograms: e.studyPrograms.map(sp => ({
      id: sp.studyProgram.id,
      name: sp.studyProgram.name,
      institution: sp.studyProgram.institution as unknown as Institution,
      clusterId: sp.studyProgram.clusterId || undefined,
    })),
    createdAt: new Date(e.createdAt),
    updatedAt: new Date(e.updatedAt),
  }))
}

/**
 * Clear a session
 */
export function clearSession(sessionId: string): void {
  sessions.delete(sessionId)
}

export const navigatorService = {
  createSession,
  getSession,
  processMessage,
  getRecommendations,
  getEventsForPrograms,
  detectCrisis,
  clearSession,
}

export default navigatorService
