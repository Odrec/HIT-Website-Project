import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockProgramFindMany = vi.fn()
const mockEventFindMany = vi.fn()

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    studyProgram: { findMany: (...a: unknown[]) => mockProgramFindMany(...a) },
    event: { findMany: (...a: unknown[]) => mockEventFindMany(...a) },
  },
}))

vi.mock('@/lib/active-edition', () => ({
  getActiveEditionId: vi.fn().mockResolvedValue('edition-1'),
  getActiveEdition: vi.fn(),
}))

vi.mock('@/lib/cache/redis', () => ({
  redis: {},
  isRedisConnected: vi.fn().mockResolvedValue(false),
}))

import { navigatorService, NavigatorUnavailableError } from '@/services/navigator-service'

const programs = [
  {
    id: 'cuid-bio',
    name: 'Biologie',
    institution: 'UNI',
    lehramtTypen: [],
    isLehramtStudiengang: false,
    isBeruflicheFachrichtung: false,
    clusters: [{ id: 'c1', name: 'MINT', sortOrder: 1 }],
  },
  {
    id: 'cuid-land',
    name: 'Landschaftsentwicklung (B.Eng.)',
    institution: 'HOCHSCHULE',
    lehramtTypen: [],
    isLehramtStudiengang: false,
    isBeruflicheFachrichtung: false,
    clusters: [{ id: 'c2', name: 'Agrar', sortOrder: 1 }],
  },
]
// buildCatalogue order: UNI first → P1 = Biologie, P2 = Landschaftsentwicklung

function llmReply(content: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => 'err',
    json: async () => ({ choices: [{ message: { content } }] }),
  }
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  process.env.OPENAI_API_BASE_URL = 'http://llm.test/v1'
  process.env.OPENAI_API_KEY = 'k'
  process.env.OPENAI_MODEL = 'test-model'
  mockProgramFindMany.mockResolvedValue(programs)
  mockEventFindMany.mockResolvedValue([])
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('startSession', () => {
  it('creates a guided session with greeting and six options without calling the model', async () => {
    const s = await navigatorService.startSession()
    expect(s.phase).toBe('guided')
    expect(s.messages).toHaveLength(1)
    expect(s.messages[0].role).toBe('assistant')
    expect(s.messages[0].metadata?.options).toHaveLength(6)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('processMessage', () => {
  it('sends system prompt with catalogue + history and stores options from the reply', async () => {
    const s = await navigatorService.startSession()
    fetchMock.mockResolvedValue(
      llmReply('Magst du eher Theorie?\nOPTIONS: [{"option":"Theorie"},{"option":"Praxis"}]')
    )
    const r = await navigatorService.processMessage(s.id, 'Praktisch arbeiten')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://llm.test/v1/chat/completions')
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.model).toBe('test-model')
    expect(body.temperature).toBe(0.4)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[0].content).toContain('P1 | Biologie')
    expect(body.messages[0].content).toContain('Beantwortete Fragen bisher: 1')
    // history: greeting (assistant) + user
    expect(body.messages.slice(1).map((m: { role: string }) => m.role)).toEqual([
      'assistant',
      'user',
    ])

    expect(r.response.content).toBe('Magst du eher Theorie?')
    expect(r.response.metadata?.options).toEqual([{ label: 'Theorie' }, { label: 'Praxis' }])
    expect(r.session.phase).toBe('guided')
    expect(r.recommendation).toBeUndefined()
  })

  it('resolves EMPFEHLUNG short IDs, drops unknown ones, attaches events and switches to followup', async () => {
    const s = await navigatorService.startSession()
    mockEventFindMany.mockResolvedValue([
      {
        id: 'ev1',
        title: 'Biologie Vortrag',
        description: null,
        eventType: 'VORTRAG',
        timeStart: new Date('2026-11-19T10:00:00Z'),
        timeEnd: new Date('2026-11-19T10:45:00Z'),
        locationDetails: null,
        roomRequest: null,
        meetingPoint: null,
        additionalInfo: null,
        photoUrl: null,
        institution: 'UNI',
        isCrossProgram: false,
        locationHint: null,
        building: null,
        room: null,
        melderId: null,
        buildingId: null,
        roomId: null,
        lecturers: [],
        studyPrograms: [{ studyProgram: { id: 'cuid-bio', name: 'Biologie', institution: 'UNI' } }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    fetchMock.mockResolvedValue(
      llmReply(
        'Meine Vorschläge.\nEMPFEHLUNG: {"programs":[{"id":"P1","reason":"Natur"},{"id":"P99","reason":"x"},{"id":"p2","reason":"Draußen"}],"summary":"Du magst Natur."}'
      )
    )
    const r = await navigatorService.processMessage(s.id, 'Natur und draußen')

    expect(r.session.phase).toBe('followup')
    expect(r.recommendation?.summary).toBe('Du magst Natur.')
    expect(r.recommendation?.programs.map((p) => p.program.id)).toEqual(['cuid-bio', 'cuid-land'])
    expect(r.recommendation?.programs[0].reason).toBe('Natur')
    expect(r.recommendation?.programs[0].relatedEvents?.[0].id).toBe('ev1')
    expect(r.recommendation?.programs[1].relatedEvents).toEqual([])
    expect(mockEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ editionId: 'edition-1', reviewStatus: 'PUBLISHED' }),
      })
    )
    // stored for later retrieval
    const stored = await navigatorService.getRecommendation(s.id)
    expect(stored?.programs.map((p) => p.program.name)).toEqual([
      'Biologie',
      'Landschaftsentwicklung (B.Eng.)',
    ])
  })

  it('keeps the previous recommendation when a followup reply has no trailer', async () => {
    const s = await navigatorService.startSession()
    fetchMock.mockResolvedValueOnce(
      llmReply('Vorschläge.\nEMPFEHLUNG: {"programs":[{"id":"P1","reason":"a"}],"summary":"s"}')
    )
    await navigatorService.processMessage(s.id, 'eins')
    fetchMock.mockResolvedValueOnce(llmReply('Biologie dauert 6 Semester.'))
    const r = await navigatorService.processMessage(s.id, 'Wie lange dauert Biologie?')
    expect(r.recommendation).toBeUndefined()
    expect(r.session.phase).toBe('followup')
    expect((await navigatorService.getRecommendation(s.id))?.programs).toHaveLength(1)
  })

  it('ignores an EMPFEHLUNG whose IDs are all unknown', async () => {
    const s = await navigatorService.startSession()
    fetchMock.mockResolvedValue(
      llmReply('Text.\nEMPFEHLUNG: {"programs":[{"id":"P77","reason":"?"}],"summary":"s"}')
    )
    const r = await navigatorService.processMessage(s.id, 'x')
    expect(r.recommendation).toBeUndefined()
    expect(r.session.phase).toBe('guided')
    expect(r.response.content).toBe('Text.')
  })

  it('throws NavigatorUnavailableError on a non-2xx gateway response', async () => {
    const s = await navigatorService.startSession()
    fetchMock.mockResolvedValue(llmReply('', 502))
    await expect(navigatorService.processMessage(s.id, 'x')).rejects.toBeInstanceOf(
      NavigatorUnavailableError
    )
  })

  it('throws NavigatorUnavailableError on a network error', async () => {
    const s = await navigatorService.startSession()
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'))
    await expect(navigatorService.processMessage(s.id, 'x')).rejects.toBeInstanceOf(
      NavigatorUnavailableError
    )
  })

  it('throws NavigatorUnavailableError when no gateway is configured', async () => {
    delete process.env.OPENAI_API_BASE_URL
    delete process.env.OPENAI_API_KEY
    const s = await navigatorService.startSession()
    await expect(navigatorService.processMessage(s.id, 'x')).rejects.toBeInstanceOf(
      NavigatorUnavailableError
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not persist the user message when the gateway fails', async () => {
    const s = await navigatorService.startSession()
    fetchMock.mockResolvedValue(llmReply('', 500))
    await navigatorService.processMessage(s.id, 'verloren?').catch(() => undefined)
    fetchMock.mockResolvedValue(llmReply('Ok.\nOPTIONS: [{"option":"A"}]'))
    await navigatorService.processMessage(s.id, 'nochmal')
    const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)
    const userTurns = body.messages.filter((m: { role: string }) => m.role === 'user')
    expect(userTurns).toHaveLength(1)
    expect(userTurns[0].content).toBe('nochmal')
  })

  it('short-circuits on high-severity crisis without calling the model', async () => {
    const s = await navigatorService.startSession()
    const r = await navigatorService.processMessage(s.id, 'ich will nicht mehr leben')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(r.crisis?.severity).toBe('high')
    expect(r.response.content).toContain('Telefonseelsorge')
    expect(r.session.crisisDetected).toBe(true)
  })

  it('creates a fresh session when the id is unknown', async () => {
    fetchMock.mockResolvedValue(llmReply('Hi.\nOPTIONS: [{"option":"A"}]'))
    const r = await navigatorService.processMessage('nav-unknown', 'hallo')
    expect(r.session.id).toBe('nav-unknown')
    expect(r.session.messages[0].role).toBe('assistant') // greeting was seeded
  })
})

describe('getModelDisplayName', () => {
  it('formats local gateway models', () => {
    expect(navigatorService.getModelDisplayName()).toBe('Local test-model')
  })
  it('reports missing configuration', () => {
    delete process.env.OPENAI_API_BASE_URL
    delete process.env.OPENAI_API_KEY
    expect(navigatorService.getModelDisplayName()).toBe('Nicht konfiguriert')
  })
})
