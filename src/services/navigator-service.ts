// Navigator Service – model-driven Studiengang recommendations.
//
// The LLM reads the full HIT programme catalogue in its system prompt and
// returns programme picks in an EMPFEHLUNG trailer line. This service owns
// session lifecycle, crisis detection, the single gateway call per turn,
// short-ID resolution and event attachment. There is no keyword matcher
// and no fallback question script: if the gateway is unavailable we throw
// NavigatorUnavailableError and the API returns 503.

import { prisma } from '@/lib/db/prisma'
import { getActiveEditionId } from '@/lib/active-edition'
import { parseNavigatorReply } from '@/lib/navigator-reply'
import {
  buildCatalogue,
  buildNavigatorSystemPrompt,
  NAVIGATOR_GREETING,
  FIRST_QUESTION_OPTIONS,
  type NavigatorCatalogue,
  type CatalogueProgramInput,
} from '@/lib/navigator-prompt'
import {
  getNavigatorSession,
  saveNavigatorSession,
  deleteNavigatorSession,
} from '@/lib/navigator-session-store'
import {
  CRISIS_KEYWORDS,
  CRISIS_HIGH_SEVERITY_KEYWORDS,
  CRISIS_SUPPORT_RESOURCES,
  type NavigatorSession,
  type NavigatorMessage,
  type NavigatorRecommendation,
  type ProgramRecommendation,
  type CrisisDetection,
} from '@/types/navigator'
import { Institution, EventType, Affiliation } from '@/types/events'
import type { StudyProgram, Event, Building, Room } from '@/types/events'

export class NavigatorUnavailableError extends Error {
  constructor(message = 'Navigator LLM gateway unavailable') {
    super(message)
    this.name = 'NavigatorUnavailableError'
  }
}

// ---------------------------------------------------------------------------
// Catalogue cache (10 minutes)
// ---------------------------------------------------------------------------

const CATALOGUE_TTL_MS = 10 * 60 * 1000
let cachedCatalogue: { builtAt: number; catalogue: NavigatorCatalogue } | null = null

async function loadCatalogue(): Promise<NavigatorCatalogue> {
  if (cachedCatalogue && Date.now() - cachedCatalogue.builtAt < CATALOGUE_TTL_MS) {
    return cachedCatalogue.catalogue
  }
  const programs = await prisma.studyProgram.findMany({
    select: {
      id: true,
      name: true,
      institution: true,
      lehramtTypen: true,
      isLehramtStudiengang: true,
      isBeruflicheFachrichtung: true,
      clusters: { select: { id: true, name: true, sortOrder: true } },
    },
  })
  const catalogue = buildCatalogue(programs as unknown as CatalogueProgramInput[])
  cachedCatalogue = { builtAt: Date.now(), catalogue }
  return catalogue
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

function generateSessionId(): string {
  return `nav-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function greetingMessage(): NavigatorMessage {
  return {
    id: `msg-init-${Date.now()}`,
    role: 'assistant',
    content: NAVIGATOR_GREETING,
    timestamp: new Date(),
    metadata: { options: FIRST_QUESTION_OPTIONS },
  }
}

function newSession(id = generateSessionId()): NavigatorSession {
  return {
    id,
    startedAt: new Date(),
    phase: 'guided',
    messages: [greetingMessage()],
    recommendation: null,
    crisisDetected: false,
  }
}

export async function startSession(): Promise<NavigatorSession> {
  const session = newSession()
  await saveNavigatorSession(session)
  return session
}

export async function clearSession(sessionId: string): Promise<void> {
  await deleteNavigatorSession(sessionId)
}

// ---------------------------------------------------------------------------
// Crisis detection
// ---------------------------------------------------------------------------

export function detectCrisis(message: string): CrisisDetection {
  const lower = message.toLowerCase()
  const keywords = CRISIS_KEYWORDS.filter((k) => lower.includes(k))
  if (keywords.length === 0) {
    return { detected: false, keywords: [], severity: 'low', resources: [] }
  }
  const hasHigh = keywords.some((k) => CRISIS_HIGH_SEVERITY_KEYWORDS.includes(k))
  const severity = hasHigh ? 'high' : keywords.length > 2 ? 'medium' : 'low'
  return { detected: true, keywords, severity, resources: CRISIS_SUPPORT_RESOURCES }
}

const CRISIS_REPLY = `Es tut mir leid zu hören, dass du dich so fühlst. Deine Gefühle sind wichtig und es gibt Menschen, die dir helfen können.

Die Telefonseelsorge ist rund um die Uhr erreichbar unter 0800 111 0 111 (kostenlos und anonym).

Wenn du möchtest, können wir auch weiter über Studiengänge sprechen – aber dein Wohlbefinden hat Priorität.`

// ---------------------------------------------------------------------------
// Gateway
// ---------------------------------------------------------------------------

function gatewayConfig(): { url: string; apiKey: string; model: string } | null {
  const baseUrl = process.env.OPENAI_API_BASE_URL
  const apiKey = process.env.OPENAI_API_KEY
  if (!baseUrl && !apiKey) return null
  const url = baseUrl
    ? `${baseUrl.replace(/\/+$/, '')}/chat/completions`
    : 'https://api.openai.com/v1/chat/completions'
  return { url, apiKey: apiKey ?? '', model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }
}

export function getModelDisplayName(): string {
  const cfg = gatewayConfig()
  if (!cfg) return 'Nicht konfiguriert'
  const baseUrl = process.env.OPENAI_API_BASE_URL
  const provider = baseUrl && !baseUrl.includes('openai.com') ? 'Local' : 'OpenAI'
  return `${provider} ${cfg.model}`
}

async function callChatCompletion(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const cfg = gatewayConfig()
  if (!cfg) {
    console.error('[navigator] no OPENAI_API_BASE_URL / OPENAI_API_KEY configured')
    throw new NavigatorUnavailableError('not configured')
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`

  let response: Response
  try {
    response = await fetch(cfg.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: cfg.model, messages, temperature: 0.4, max_tokens: 1200 }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch (error) {
    console.error('[navigator] gateway request failed:', error)
    throw new NavigatorUnavailableError()
  }
  if (!response.ok) {
    console.error('[navigator] gateway error', response.status, await response.text())
    throw new NavigatorUnavailableError(`status ${response.status}`)
  }
  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    console.error('[navigator] empty completion')
    throw new NavigatorUnavailableError('empty completion')
  }
  return content
}

// ---------------------------------------------------------------------------
// Turn processing
// ---------------------------------------------------------------------------

export async function processMessage(
  sessionId: string,
  userMessage: string
): Promise<{
  session: NavigatorSession
  response: NavigatorMessage
  recommendation?: NavigatorRecommendation
  crisis?: CrisisDetection
}> {
  const session = (await getNavigatorSession(sessionId)) ?? newSession(sessionId)

  const crisis = detectCrisis(userMessage)
  if (crisis.detected) session.crisisDetected = true

  const userMsg: NavigatorMessage = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  }

  if (crisis.detected && crisis.severity === 'high') {
    const support: NavigatorMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: CRISIS_REPLY,
      timestamp: new Date(),
      metadata: {
        resources: crisis.resources.map((r) => ({
          type: 'counseling' as const,
          title: r.name,
          description: r.description,
          url: r.url,
        })),
      },
    }
    session.messages.push(userMsg, support)
    await saveNavigatorSession(session)
    return { session, response: support, crisis }
  }

  const catalogue = await loadCatalogue()
  const history = [...session.messages, userMsg]
  const answeredQuestions = history.filter((m) => m.role === 'user').length
  const systemPrompt = buildNavigatorSystemPrompt(catalogue, {
    answeredQuestions,
    phase: session.phase,
  })

  // Throws NavigatorUnavailableError; the user message is NOT persisted then,
  // so the visitor can simply resend it.
  const raw = await callChatCompletion([
    { role: 'system', content: systemPrompt },
    ...history
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ])

  const parsed = parseNavigatorReply(raw)

  let recommendation: NavigatorRecommendation | undefined
  if (parsed.recommendation) {
    const resolved = parsed.recommendation.programs
      .map((p) => ({ row: catalogue.byShortId.get(p.id.toUpperCase()), reason: p.reason }))
      .filter((x): x is { row: NonNullable<typeof x.row>; reason: string } => Boolean(x.row))
    // de-duplicate by programme id, keep first reason
    const seen = new Set<string>()
    const unique = resolved.filter((x) => (seen.has(x.row.id) ? false : (seen.add(x.row.id), true)))
    if (unique.length > 0) {
      session.recommendation = {
        programs: unique.map((x) => ({ programId: x.row.id, reason: x.reason })),
        summary: parsed.recommendation.summary,
      }
      session.phase = 'followup'
      recommendation = (await hydrateRecommendation(session, catalogue)) ?? undefined
    } else {
      console.warn('[navigator] EMPFEHLUNG contained no known IDs:', parsed.recommendation)
    }
  }

  const assistantMsg: NavigatorMessage = {
    id: `msg-${Date.now() + 1}`,
    role: 'assistant',
    content: parsed.text || raw.trim(),
    timestamp: new Date(),
    metadata:
      parsed.options && session.phase === 'guided' ? { options: parsed.options } : undefined,
  }

  session.messages.push(userMsg, assistantMsg)
  await saveNavigatorSession(session)

  return {
    session,
    response: assistantMsg,
    recommendation,
    crisis: crisis.detected ? crisis : undefined,
  }
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

function toStudyProgram(row: {
  id: string
  name: string
  institution: string
  clusters: { id: string; name: string }[]
}): StudyProgram {
  return {
    id: row.id,
    name: row.name,
    institution: row.institution as Institution,
    clusters: row.clusters.map((c) => ({ id: c.id, name: c.name })),
  }
}

async function hydrateRecommendation(
  session: NavigatorSession,
  catalogue: NavigatorCatalogue
): Promise<NavigatorRecommendation | null> {
  if (!session.recommendation) return null
  const rowsById = new Map(catalogue.rows.map((r) => [r.id, r]))
  const picks = session.recommendation.programs.filter((p) => rowsById.has(p.programId))
  if (picks.length === 0) return null

  const events = await getEventsForPrograms(picks.map((p) => p.programId))
  const programs: ProgramRecommendation[] = picks.map((p) => {
    const row = rowsById.get(p.programId)!
    return {
      program: toStudyProgram(row),
      reason: p.reason,
      relatedEvents: events.filter((e) => e.studyPrograms?.some((sp) => sp.id === p.programId)),
    }
  })
  return { programs, summary: session.recommendation.summary }
}

export async function getRecommendation(
  sessionId: string
): Promise<NavigatorRecommendation | null> {
  const session = await getNavigatorSession(sessionId)
  if (!session?.recommendation) return null
  return hydrateRecommendation(session, await loadCatalogue())
}

export async function getEventsForPrograms(programIds: string[]): Promise<Event[]> {
  if (programIds.length === 0) return []
  const editionId = await getActiveEditionId()
  const events = await prisma.event.findMany({
    where: {
      studyPrograms: { some: { studyProgramId: { in: programIds } } },
      editionId,
      reviewStatus: 'PUBLISHED',
    },
    include: {
      building: true,
      room: true,
      lecturers: true,
      studyPrograms: { include: { studyProgram: true } },
    },
    orderBy: { timeStart: 'asc' },
  })

  return events.map(
    (e): Event => ({
      id: e.id,
      title: e.title,
      description: e.description || undefined,
      eventType: e.eventType as unknown as EventType,
      timeStart: e.timeStart ? new Date(e.timeStart) : undefined,
      timeEnd: e.timeEnd ? new Date(e.timeEnd) : undefined,
      locationDetails: e.locationDetails as Record<string, unknown> | undefined,
      roomRequest: e.roomRequest || undefined,
      meetingPoint: e.meetingPoint || undefined,
      additionalInfo: e.additionalInfo || undefined,
      photoUrl: e.photoUrl || undefined,
      institution: e.institution as unknown as Institution,
      isCrossProgram: e.isCrossProgram ?? false,
      locationHint: e.locationHint ?? null,
      building: (e.building as unknown as Building) ?? undefined,
      room: (e.room as unknown as Room) ?? undefined,
      melderId: e.melderId ?? null,
      buildingId: e.buildingId ?? null,
      roomId: e.roomId ?? null,
      lecturers: e.lecturers.map((l) => ({
        id: l.id,
        eventId: l.eventId,
        firstName: l.firstName,
        lastName: l.lastName,
        title: l.title || undefined,
        email: l.email || undefined,
        affiliation: (l.affiliation as unknown as Affiliation | undefined) || undefined,
      })),
      studyPrograms: e.studyPrograms.map((sp) => ({
        id: sp.studyProgram.id,
        name: sp.studyProgram.name,
        institution: sp.studyProgram.institution as unknown as Institution,
      })),
      createdAt: new Date(e.createdAt),
      updatedAt: new Date(e.updatedAt),
    })
  )
}

export const navigatorService = {
  startSession,
  processMessage,
  getRecommendation,
  getEventsForPrograms,
  clearSession,
  detectCrisis,
  getModelDisplayName,
}

export default navigatorService
