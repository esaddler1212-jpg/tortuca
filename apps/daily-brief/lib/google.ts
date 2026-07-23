import 'server-only'
import { cookies } from 'next/headers'
import type { CalendarEvent } from './calendar'
import type { PriorityEmail } from './email'
import {
  mapGoogleEvent,
  mapGmailMessage,
  type GoogleEvent,
  type GmailMessage,
} from './google-map'

export const GOOGLE_COOKIE = 'ecs_google_rt'
export const GOOGLE_STATE_COOKIE = 'ecs_google_state'

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
]

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export function hasGoogleSession(): boolean {
  return Boolean(cookies().get(GOOGLE_COOKIE)?.value)
}

export function isGoogleConnected(): boolean {
  return isGoogleConfigured() && hasGoogleSession()
}

export function redirectUri(): string {
  return (
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_BRIEF_URL || 'http://localhost:3004'}/api/google/callback`
  )
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: redirectUri(),
    response_type: 'code',
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    scope: GOOGLE_SCOPES.join(' '),
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

interface TokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
}

export async function exchangeCode(code: string): Promise<TokenResponse | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: redirectUri(),
        grant_type: 'authorization_code',
      }),
    })
    if (!res.ok) return null
    return (await res.json()) as TokenResponse
  } catch {
    return null
  }
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        grant_type: 'refresh_token',
      }),
    })
    if (!res.ok) return null
    return (await res.json()) as TokenResponse
  } catch {
    return null
  }
}

// Cache access tokens in-memory keyed by refresh token so we don't refresh on
// every render (we can't set cookies during a server-component render).
type Cached = { accessToken: string; expiry: number }
const globalRef = globalThis as unknown as { __googTokens?: Map<string, Cached> }
const tokenCache = globalRef.__googTokens ?? (globalRef.__googTokens = new Map())

export async function getAccessToken(): Promise<string | null> {
  if (!isGoogleConfigured()) return null
  const refresh = cookies().get(GOOGLE_COOKIE)?.value
  if (!refresh) return null

  const cached = tokenCache.get(refresh)
  if (cached && cached.expiry > Date.now() + 60_000) return cached.accessToken

  const refreshed = await refreshAccessToken(refresh)
  if (!refreshed) return null
  tokenCache.set(refresh, {
    accessToken: refreshed.access_token,
    expiry: Date.now() + refreshed.expires_in * 1000,
  })
  return refreshed.access_token
}

// --- Calendar --------------------------------------------------------------
export async function fetchGoogleEvents(): Promise<CalendarEvent[] | null> {
  const token = await getAccessToken()
  if (!token) return null

  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const params = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '20',
  })

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
    )
    if (!res.ok) return null
    const json = (await res.json()) as { items?: GoogleEvent[] }
    return (json.items ?? []).map(mapGoogleEvent)
  } catch {
    return null
  }
}

// --- Gmail -----------------------------------------------------------------
export async function fetchGmailPriority(): Promise<PriorityEmail[] | null> {
  const token = await getAccessToken()
  if (!token) return null
  const auth = { Authorization: `Bearer ${token}` }

  try {
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?' +
        new URLSearchParams({ q: 'is:important newer_than:1d', maxResults: '8' }),
      { headers: auth, cache: 'no-store' },
    )
    if (!listRes.ok) return null
    const list = (await listRes.json()) as { messages?: { id: string }[] }
    const ids = (list.messages ?? []).map((m) => m.id)

    const messages = await Promise.all(
      ids.map(async (id) => {
        const params = new URLSearchParams({ format: 'metadata' })
        params.append('metadataHeaders', 'From')
        params.append('metadataHeaders', 'Subject')
        params.append('metadataHeaders', 'Date')
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?${params.toString()}`,
          { headers: auth, cache: 'no-store' },
        )
        if (!res.ok) return null
        return (await res.json()) as GmailMessage
      }),
    )

    return messages
      .filter((m): m is GmailMessage => m !== null)
      .map(mapGmailMessage)
  } catch {
    return null
  }
}
