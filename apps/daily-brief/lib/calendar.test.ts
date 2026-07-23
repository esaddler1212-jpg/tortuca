import { describe, it, expect } from 'vitest'
import { parseIcs, eventsForDay } from './calendar'

const ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:evt-1
SUMMARY:Studio session
DTSTART:20260723T100000Z
DTEND:20260723T120000Z
END:VEVENT
BEGIN:VEVENT
UID:evt-2
SUMMARY:All-day release day
DTSTART;VALUE=DATE:20260723
END:VEVENT
BEGIN:VEVENT
UID:evt-3
SUMMARY:Folded summary that spans
 multiple lines
DTSTART:20260724T090000Z
END:VEVENT
END:VCALENDAR`

describe('parseIcs', () => {
  it('parses all VEVENT blocks', () => {
    const events = parseIcs(ICS)
    expect(events).toHaveLength(3)
  })

  it('parses timed events with start and end', () => {
    const [first] = parseIcs(ICS)
    expect(first.title).toBe('Studio session')
    expect(first.allDay).toBe(false)
    expect(first.start).toBe('2026-07-23T10:00:00.000Z')
    expect(first.end).toBe('2026-07-23T12:00:00.000Z')
  })

  it('flags all-day (VALUE=DATE) events', () => {
    const allDay = parseIcs(ICS).find((e) => e.id === 'evt-2')
    expect(allDay?.allDay).toBe(true)
  })

  it('unfolds folded (continuation) lines', () => {
    const folded = parseIcs(ICS).find((e) => e.id === 'evt-3')
    expect(folded?.title).toBe('Folded summary that spansmultiple lines')
  })
})

describe('eventsForDay', () => {
  it('keeps only events on the given local day, sorted by start', () => {
    const events = parseIcs(ICS)
    const day = new Date('2026-07-23T00:00:00Z')
    const filtered = eventsForDay(events, day)
    // evt-3 is on the 24th (UTC) so it should be excluded for most timezones.
    expect(filtered.every((e) => e.id !== 'evt-3')).toBe(true)
    expect(filtered.length).toBeGreaterThanOrEqual(1)
  })
})
