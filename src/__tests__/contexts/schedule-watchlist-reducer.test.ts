import { describe, it, expect } from 'vitest'
import { EventType, Institution } from '@/types/events'
import type { Event } from '@/types/events'
import { scheduleReducer, initialState, type ScheduleEvent } from '@/contexts/schedule-context'

let idCounter = 0
function makeEvent(): Event {
  const id = `event-${++idCounter}`
  return {
    id,
    title: `Test ${id}`,
    eventType: EventType.VORTRAG,
    timeStart: new Date('2026-11-19T09:00:00'),
    timeEnd: new Date('2026-11-19T09:45:00'),
    institution: Institution.UNI,
    createdAt: new Date('2026-11-19T00:00:00'),
    updatedAt: new Date('2026-11-19T00:00:00'),
  }
}

function makeScheduleEvent(event: Event): ScheduleEvent {
  return { id: `s-${event.id}`, eventId: event.id, event, priority: 'MEDIUM', addedAt: new Date() }
}

describe('scheduleReducer — watchlist', () => {
  it('ADD_WATCHLIST adds to watchlist', () => {
    const e = makeScheduleEvent(makeEvent())
    const state = scheduleReducer(initialState, { type: 'ADD_WATCHLIST', payload: e })
    expect(state.watchlist.map((w) => w.eventId)).toEqual([e.eventId])
  })

  it('ADD_WATCHLIST removes the event from the schedule (mutual exclusivity)', () => {
    const e = makeScheduleEvent(makeEvent())
    const scheduled = scheduleReducer(initialState, { type: 'ADD_EVENT', payload: e })
    expect(scheduled.items).toHaveLength(1)
    const watched = scheduleReducer(scheduled, { type: 'ADD_WATCHLIST', payload: e })
    expect(watched.items).toHaveLength(0)
    expect(watched.watchlist.map((w) => w.eventId)).toEqual([e.eventId])
  })

  it('ADD_EVENT removes the event from the watchlist (promote = move)', () => {
    const e = makeScheduleEvent(makeEvent())
    const watched = scheduleReducer(initialState, { type: 'ADD_WATCHLIST', payload: e })
    const promoted = scheduleReducer(watched, { type: 'ADD_EVENT', payload: e })
    expect(promoted.watchlist).toHaveLength(0)
    expect(promoted.items.map((i) => i.eventId)).toEqual([e.eventId])
  })

  it('ADD_WATCHLIST is idempotent (no duplicate)', () => {
    const e = makeScheduleEvent(makeEvent())
    const once = scheduleReducer(initialState, { type: 'ADD_WATCHLIST', payload: e })
    const twice = scheduleReducer(once, { type: 'ADD_WATCHLIST', payload: e })
    expect(twice.watchlist).toHaveLength(1)
  })

  it('REMOVE_WATCHLIST and CLEAR_WATCHLIST empty the list', () => {
    const e = makeScheduleEvent(makeEvent())
    const added = scheduleReducer(initialState, { type: 'ADD_WATCHLIST', payload: e })
    expect(
      scheduleReducer(added, { type: 'REMOVE_WATCHLIST', payload: e.eventId }).watchlist
    ).toHaveLength(0)
    expect(scheduleReducer(added, { type: 'CLEAR_WATCHLIST' }).watchlist).toHaveLength(0)
  })

  it('CLEAR_SCHEDULE does not touch the watchlist', () => {
    const e = makeScheduleEvent(makeEvent())
    const added = scheduleReducer(initialState, { type: 'ADD_WATCHLIST', payload: e })
    expect(scheduleReducer(added, { type: 'CLEAR_SCHEDULE' }).watchlist).toHaveLength(1)
  })

  it('PRUNE_MISSING removes the given ids from both the schedule and the watchlist', () => {
    const scheduled = makeScheduleEvent(makeEvent())
    const watched = makeScheduleEvent(makeEvent())
    const kept = makeScheduleEvent(makeEvent())
    let state = scheduleReducer(initialState, { type: 'ADD_EVENT', payload: scheduled })
    state = scheduleReducer(state, { type: 'ADD_EVENT', payload: kept })
    state = scheduleReducer(state, { type: 'ADD_WATCHLIST', payload: watched })

    const pruned = scheduleReducer(state, {
      type: 'PRUNE_MISSING',
      payload: [scheduled.eventId, watched.eventId],
    })

    expect(pruned.items.map((i) => i.eventId)).toEqual([kept.eventId])
    expect(pruned.watchlist).toHaveLength(0)
  })

  it('PRUNE_MISSING leaves lists untouched when no ids match', () => {
    const e = makeScheduleEvent(makeEvent())
    const state = scheduleReducer(initialState, { type: 'ADD_EVENT', payload: e })
    const pruned = scheduleReducer(state, { type: 'PRUNE_MISSING', payload: ['nonexistent'] })
    expect(pruned.items.map((i) => i.eventId)).toEqual([e.eventId])
  })
})
