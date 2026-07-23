export interface CalendarEvent {
  id: string
  title: string
  start: string // ISO
  end?: string
  allDay: boolean
}

/** Unfold RFC 5545 folded lines (continuations begin with a space or tab). */
function unfold(text: string): string[] {
  const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const lines: string[] = []
  for (const line of raw) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1)
    } else {
      lines.push(line)
    }
  }
  return lines
}

function parseIcsDate(value: string): { date: Date; allDay: boolean } {
  const v = value.trim()
  if (/^\d{8}$/.test(v)) {
    const y = +v.slice(0, 4)
    const m = +v.slice(4, 6) - 1
    const d = +v.slice(6, 8)
    return { date: new Date(y, m, d), allDay: true }
  }
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/)
  if (m) {
    const [, y, mo, d, h, mi, s, z] = m
    if (z) {
      return {
        date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)),
        allDay: false,
      }
    }
    // Note: TZID params are treated as local time (scaffold limitation).
    return { date: new Date(+y, +mo - 1, +d, +h, +mi, +s), allDay: false }
  }
  const parsed = new Date(v)
  return { date: isNaN(parsed.getTime()) ? new Date(0) : parsed, allDay: false }
}

function propName(line: string): string {
  const colon = line.indexOf(':')
  if (colon === -1) return ''
  return line.slice(0, colon).split(';')[0].toUpperCase()
}

function propValue(line: string): string {
  const colon = line.indexOf(':')
  return colon === -1 ? '' : line.slice(colon + 1)
}

/** Parse an iCalendar (ICS) document into a list of events. Pure + testable. */
export function parseIcs(text: string): CalendarEvent[] {
  const lines = unfold(text)
  const events: CalendarEvent[] = []
  let cur: Partial<CalendarEvent> & { _start?: Date; _end?: Date } = {}
  let inEvent = false

  for (const line of lines) {
    const name = propName(line)
    if (line.trim() === 'BEGIN:VEVENT') {
      inEvent = true
      cur = {}
      continue
    }
    if (line.trim() === 'END:VEVENT') {
      if (cur._start) {
        events.push({
          id: cur.id || `evt-${events.length}`,
          title: cur.title || '(untitled)',
          start: cur._start.toISOString(),
          end: cur._end ? cur._end.toISOString() : undefined,
          allDay: cur.allDay ?? false,
        })
      }
      inEvent = false
      continue
    }
    if (!inEvent) continue

    switch (name) {
      case 'UID':
        cur.id = propValue(line).trim()
        break
      case 'SUMMARY':
        cur.title = propValue(line).trim()
        break
      case 'DTSTART': {
        const { date, allDay } = parseIcsDate(propValue(line))
        cur._start = date
        cur.allDay = allDay
        break
      }
      case 'DTEND': {
        const { date } = parseIcsDate(propValue(line))
        cur._end = date
        break
      }
      default:
        break
    }
  }

  return events
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Filters events down to those starting on the given day (defaults to today). */
export function eventsForDay(
  events: CalendarEvent[],
  day: Date = new Date(),
): CalendarEvent[] {
  return events
    .filter((e) => sameLocalDay(new Date(e.start), day))
    .sort((a, b) => a.start.localeCompare(b.start))
}

export function isCalendarConfigured(): boolean {
  return Boolean(process.env.CALENDAR_ICS_URL)
}

export function sampleTodayEvents(): CalendarEvent[] {
  const at = (h: number, m = 0) => {
    const d = new Date()
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }
  return [
    { id: 's1', title: 'Studio session — vocal takes', start: at(10), end: at(12), allDay: false },
    { id: 's2', title: 'Easy Supply — production sync', start: at(13, 30), end: at(14), allDay: false },
    { id: 's3', title: 'Call: North Star founder intro', start: at(16), end: at(16, 30), allDay: false },
  ]
}

/**
 * Fetches today's events from the configured ICS calendar feed
 * (`CALENDAR_ICS_URL`). Returns `null` when not configured or unreachable so
 * the caller can fall back. This is how a phone calendar (Apple/Google) is
 * surfaced to the web: subscribe to its private iCal/ICS URL.
 */
export async function fetchIcsEvents(): Promise<CalendarEvent[] | null> {
  const url = process.env.CALENDAR_ICS_URL
  if (!url) return null

  try {
    const init: RequestInit & { next?: { revalidate?: number } } = {
      next: { revalidate: 300 },
    }
    const res = await fetch(url, init)
    if (!res.ok) return null
    const text = await res.text()
    return eventsForDay(parseIcs(text))
  } catch {
    return null
  }
}
