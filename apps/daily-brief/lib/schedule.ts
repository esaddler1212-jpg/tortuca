import 'server-only'
import type { CalendarEvent } from './calendar'
import { fetchIcsEvents, sampleTodayEvents } from './calendar'
import { fetchGoogleEvents, isGoogleConnected } from './google'
import { eventsForDay } from './calendar'

export type ScheduleSource = 'google' | 'ics' | 'sample'

export interface Schedule {
  events: CalendarEvent[]
  source: ScheduleSource
}

/**
 * Resolves today's schedule from the best available source:
 * Google Calendar (if connected) → ICS feed → bundled sample.
 */
export async function getSchedule(): Promise<Schedule> {
  if (isGoogleConnected()) {
    const google = await fetchGoogleEvents()
    if (google) return { events: eventsForDay(google), source: 'google' }
  }

  const ics = await fetchIcsEvents()
  if (ics) return { events: ics, source: 'ics' }

  return { events: sampleTodayEvents(), source: 'sample' }
}
