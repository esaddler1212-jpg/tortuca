import { getValidAccessToken } from './auth'
import type {
  AudioFeatures,
  PlaylistTrackItem,
  SpotifyPlaylist,
  SpotifyTrack,
} from './types'

const API = 'https://api.spotify.com/v1'

async function spotifyFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getValidAccessToken()
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (res.status === 204) return res
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Spotify API ${path}: ${text}`)
  }
  return res
}

export async function getCurrentUser(): Promise<{ display_name: string }> {
  const res = await spotifyFetch('/me')
  return res.json()
}

export async function getUserPlaylists(): Promise<SpotifyPlaylist[]> {
  const items: SpotifyPlaylist[] = []
  let url: string | null = '/me/playlists?limit=50'
  while (url) {
    const res = await spotifyFetch(url.replace(API, ''))
    const data = await res.json()
    items.push(...data.items)
    url = data.next
      ? new URL(data.next).pathname.replace(/^\/v1/, '') +
        new URL(data.next).search
      : null
  }
  return items
}

export async function getPlaylistTracks(
  playlistId: string,
): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = []
  let url: string | null = `/playlists/${playlistId}/tracks?limit=100`
  while (url) {
    const res = await spotifyFetch(url)
    const data = await res.json()
    for (const item of data.items as PlaylistTrackItem[]) {
      if (item.track?.uri) tracks.push(item.track)
    }
    url = data.next
      ? new URL(data.next).pathname.replace(/^\/v1/, '') +
        new URL(data.next).search
      : null
  }
  return tracks
}

export async function getAudioFeatures(
  trackIds: string[],
): Promise<Map<string, AudioFeatures>> {
  const map = new Map<string, AudioFeatures>()
  for (let i = 0; i < trackIds.length; i += 100) {
    const chunk = trackIds.slice(i, i + 100)
    const res = await spotifyFetch(
      `/audio-features?ids=${chunk.join(',')}`,
    )
    const data = await res.json()
    for (const f of data.audio_features as (AudioFeatures | null)[]) {
      if (f) map.set(f.id, f)
    }
  }
  return map
}

const KEY_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

export function formatMusicalKey(key: number, mode: number): string {
  if (key < 0) return '—'
  const name = KEY_NAMES[key] ?? '?'
  return mode === 1 ? `${name} maj` : `${name} min`
}

export async function transferPlaybackToDevice(
  deviceId: string,
): Promise<void> {
  await spotifyFetch('/me/player', {
    method: 'PUT',
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  })
}

export async function playTrackUri(
  deviceId: string,
  uri: string,
  positionMs = 0,
): Promise<void> {
  await spotifyFetch(`/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify({
      uris: [uri],
      position_ms: positionMs,
    }),
  })
}

export async function setPlaybackVolume(
  deviceId: string,
  volumePercent: number,
): Promise<void> {
  const volume = Math.round(Math.max(0, Math.min(100, volumePercent)))
  await spotifyFetch(
    `/me/player/volume?volume_percent=${volume}&device_id=${deviceId}`,
    { method: 'PUT' },
  )
}
