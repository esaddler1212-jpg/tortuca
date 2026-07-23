import { describe, it, expect } from 'vitest'
import { mapGoogleEvent, mapGmailMessage } from './google-map'

describe('mapGoogleEvent', () => {
  it('maps a timed event with start and end', () => {
    const e = mapGoogleEvent({
      id: 'g1',
      summary: 'Studio session',
      start: { dateTime: '2026-07-23T10:00:00Z' },
      end: { dateTime: '2026-07-23T12:00:00Z' },
    })
    expect(e.title).toBe('Studio session')
    expect(e.allDay).toBe(false)
    expect(e.start).toBe('2026-07-23T10:00:00.000Z')
    expect(e.end).toBe('2026-07-23T12:00:00.000Z')
  })

  it('flags all-day events (date only)', () => {
    const e = mapGoogleEvent({
      id: 'g2',
      summary: 'Release day',
      start: { date: '2026-07-23' },
      end: { date: '2026-07-24' },
    })
    expect(e.allDay).toBe(true)
  })

  it('falls back to a title when summary is missing', () => {
    const e = mapGoogleEvent({ id: 'g3', start: { dateTime: '2026-07-23T09:00:00Z' } })
    expect(e.title).toBe('(untitled)')
  })
})

describe('mapGmailMessage', () => {
  it('extracts From/Subject/Date headers and snippet', () => {
    const m = mapGmailMessage({
      id: 'm1',
      snippet: 'Following up on the term sheet…',
      payload: {
        headers: [
          { name: 'From', value: 'label@northstar.example' },
          { name: 'Subject', value: 'Re: term sheet' },
          { name: 'Date', value: 'Thu, 23 Jul 2026 06:40:00 +0000' },
        ],
      },
    })
    expect(m.from).toBe('label@northstar.example')
    expect(m.subject).toBe('Re: term sheet')
    expect(m.snippet).toBe('Following up on the term sheet…')
    expect(m.receivedAt).toBe('2026-07-23T06:40:00.000Z')
    expect(m.reason).toBe('Marked important')
  })

  it('is case-insensitive on header names and handles missing fields', () => {
    const m = mapGmailMessage({
      id: 'm2',
      payload: { headers: [{ name: 'subject', value: 'Lowercase header' }] },
    })
    expect(m.subject).toBe('Lowercase header')
    expect(m.from).toBe('unknown')
    expect(m.snippet).toBe('')
  })
})
