export const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ')

export const REDIRECT_URI =
  typeof window !== 'undefined'
    ? `${window.location.origin}/callback`
    : 'http://localhost:5173/callback'

export function getClientId(): string {
  const id = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  if (!id || id === 'your_spotify_client_id') {
    return ''
  }
  return id
}

export const TOKEN_STORAGE_KEY = 'tortuca_spotify_tokens'
export const PKCE_VERIFIER_KEY = 'tortuca_pkce_verifier'
