// Pure, dependency-free mappers for Google API payloads. Kept separate from
// `google.ts` (which imports `server-only` / `next/headers`) so they can be
// unit-tested in a plain Node environment.
import type { CalendarEvent } from './calendar'
import type { PriorityEmail } from './email'

interface GoogleEventTime {
  dateTime?: string
  date?: string
}

export interface GoogleEvent {
  id: string
  summary?: string
  start?: GoogleEventTime
  end?: GoogleEventTime
}

export interface GmailMessage {
  id: string
  snippet?: string
  payload?: { headers?: { name: string; value: string }[] }
}

export function mapGoogleEvent(item: GoogleEvent): CalendarEvent {
  const startRaw = item.start?.dateTime ?? item.start?.date ?? ''
  const endRaw = item.end?.dateTime ?? item.end?.date
  const allDay = !item.start?.dateTime
  const toIso = (v: string) => {
    const d = new Date(v)
    return isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString()
  }
  return {
    id: item.id,
    title: item.summary?.trim() || '(untitled)',
    start: toIso(startRaw),
    end: endRaw ? toIso(endRaw) : undefined,
    allDay,
  }
}

function header(msg: GmailMessage, name: string): string {
  const h = msg.payload?.headers?.find(
    (x) => x.name.toLowerCase() === name.toLowerCase(),
  )
  return h?.value ?? ''
}

export function mapGmailMessage(msg: GmailMessage): PriorityEmail {
  const dateHeader = header(msg, 'Date')
  const parsed = dateHeader ? new Date(dateHeader) : new Date()
  return {
    id: msg.id,
    from: header(msg, 'From') || 'unknown',
    subject: header(msg, 'Subject') || '(no subject)',
    snippet: msg.snippet ?? '',
    receivedAt: isNaN(parsed.getTime())
      ? new Date().toISOString()
      : parsed.toISOString(),
    reason: 'Marked important',
  }
}
