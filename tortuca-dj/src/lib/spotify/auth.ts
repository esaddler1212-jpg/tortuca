import {
  PKCE_VERIFIER_KEY,
  REDIRECT_URI,
  SPOTIFY_SCOPES,
  TOKEN_STORAGE_KEY,
  getClientId,
} from './config'
import type { TokenBundle } from './types'

function randomString(length: number): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values, (v) => chars[v % chars.length]).join('')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  return crypto.subtle.digest('SHA-256', encoder.encode(plain))
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function createChallenge(verifier: string): Promise<string> {
  return base64UrlEncode(await sha256(verifier))
}

export function loadTokens(): TokenBundle | null {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as TokenBundle
  } catch {
    return null
  }
}

export function saveTokens(bundle: TokenBundle): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(bundle))
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export async function beginLogin(): Promise<void> {
  const clientId = getClientId()
  if (!clientId) {
    throw new Error('Set VITE_SPOTIFY_CLIENT_ID in your .env file')
  }
  const verifier = randomString(64)
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier)
  const challenge = await createChallenge(verifier)
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })
  window.location.href = `https://accounts.spotify.com/authorize?${params}`
}

export async function handleAuthCallback(
  code: string,
): Promise<TokenBundle> {
  const clientId = getClientId()
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY)
  if (!clientId || !verifier) {
    throw new Error('Missing PKCE verifier or client ID')
  }
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  })
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }
  const data = await res.json()
  sessionStorage.removeItem(PKCE_VERIFIER_KEY)
  const bundle: TokenBundle = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60_000,
  }
  saveTokens(bundle)
  return bundle
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenBundle> {
  const clientId = getClientId()
  if (!clientId) throw new Error('Missing client ID')
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error('Failed to refresh token')
  const data = await res.json()
  const bundle: TokenBundle = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at: Date.now() + data.expires_in * 1000 - 60_000,
  }
  saveTokens(bundle)
  return bundle
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = loadTokens()
  if (!tokens) return null
  if (Date.now() < tokens.expires_at) {
    return tokens.access_token
  }
  try {
    const refreshed = await refreshAccessToken(tokens.refresh_token)
    return refreshed.access_token
  } catch {
    clearTokens()
    return null
  }
}

export function logout(): void {
  clearTokens()
  window.location.href = '/'
}
