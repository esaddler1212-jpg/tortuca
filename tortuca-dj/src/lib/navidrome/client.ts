import md5Module from 'js-md5'

const md5 = md5Module as unknown as (input: string) => string

export interface NavidromeConfig {
  serverUrl: string
  username: string
  token: string
}

const STORAGE_KEY = 'tortuca_navidrome'

export function loadNavidromeConfig(): NavidromeConfig | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as NavidromeConfig
  } catch {
    return null
  }
}

export function saveNavidromeConfig(config: NavidromeConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

function randomSalt(length = 16): string {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values, (v) => chars[v % chars.length]).join('')
}

function authParams(username: string, token: string): URLSearchParams {
  const salt = randomSalt()
  const t = md5(token + salt)
  return new URLSearchParams({
    u: username,
    t,
    s: salt,
    v: '1.16.1',
    c: 'TortucaDJ',
    f: 'json',
  })
}

function baseUrl(config: NavidromeConfig): string {
  return config.serverUrl.replace(/\/+$/, '')
}

export interface NavidromeSong {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  coverArt?: string
}

export async function pingNavidrome(config: NavidromeConfig): Promise<boolean> {
  const params = authParams(config.username, config.token)
  const url = `${baseUrl(config)}/rest/ping.view?${params}`
  const res = await fetch(url)
  if (!res.ok) return false
  const data = await res.json()
  return data['subsonic-response']?.status === 'ok'
}

export async function searchNavidrome(
  config: NavidromeConfig,
  query: string,
): Promise<NavidromeSong[]> {
  const params = authParams(config.username, config.token)
  params.set('query', query)
  params.set('songCount', '40')
  const url = `${baseUrl(config)}/rest/search3.view?${params}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Search failed (${res.status})`)
  const data = await res.json()
  const root = data['subsonic-response']
  if (root?.status !== 'ok') {
    throw new Error(root?.error?.message ?? 'Navidrome search failed')
  }
  const songs = root.searchResult3?.song ?? []
  return songs.map(
    (s: {
      id: string
      title: string
      artist: string
      album: string
      duration: number
      coverArt?: string
    }) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album,
      duration: s.duration,
      coverArt: s.coverArt,
    }),
  )
}

export async function fetchNavidromeStream(
  config: NavidromeConfig,
  songId: string,
): Promise<Blob> {
  const params = authParams(config.username, config.token)
  params.set('id', songId)
  const url = `${baseUrl(config)}/rest/getStream.view?${params}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Stream failed (${res.status})`)
  return res.blob()
}

export function coverArtUrl(config: NavidromeConfig, coverArtId: string): string {
  const params = authParams(config.username, config.token)
  params.set('id', coverArtId)
  params.set('size', '128')
  return `${baseUrl(config)}/rest/getCoverArt.view?${params}`
}
