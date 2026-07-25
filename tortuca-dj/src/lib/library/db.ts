import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { LibraryTrack } from './types'
import { normalizeMatchKey, scoreMatch } from './match'
import { getFileIdentity } from './tags'

export interface ImportFileResult {
  file: string
  status: 'matched' | 'new' | 'skipped'
  trackTitle?: string
}

interface TortucaDB extends DBSchema {
  tracks: {
    key: string
    value: LibraryTrack
    indexes: { 'by-matchKey': string; 'by-spotifyId': string }
  }
  audio: {
    key: string
    value: Blob
  }
}

const DB_NAME = 'tortuca-library'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<TortucaDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<TortucaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('tracks', { keyPath: 'id' })
        store.createIndex('by-matchKey', 'matchKey')
        store.createIndex('by-spotifyId', 'spotifyTrackId')
        db.createObjectStore('audio')
      },
    })
  }
  return dbPromise
}

export async function listTracks(): Promise<LibraryTrack[]> {
  const db = await getDb()
  const all = await db.getAll('tracks')
  return all.sort((a, b) => a.title.localeCompare(b.title))
}

export async function getTrack(id: string): Promise<LibraryTrack | undefined> {
  const db = await getDb()
  return db.get('tracks', id)
}

export async function putTrack(track: LibraryTrack): Promise<void> {
  const db = await getDb()
  await db.put('tracks', track)
}

export async function deleteTrack(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('tracks', id)
  await db.delete('audio', id)
}

export async function saveAudio(id: string, blob: Blob): Promise<void> {
  const db = await getDb()
  await db.put('audio', blob, id)
  const track = await db.get('tracks', id)
  if (track) {
    track.hasAudio = true
    await db.put('tracks', track)
  }
}

export async function getAudio(id: string): Promise<Blob | undefined> {
  const db = await getDb()
  return db.get('audio', id)
}

export async function upsertSpotifyLikeTracks(
  items: {
    id: string
    name: string
    artists: string
    album?: string
    durationMs: number
    bpm?: number
    musicalKey?: string
    artworkUrl?: string
  }[],
): Promise<{ added: number; updated: number }> {
  const db = await getDb()
  let added = 0
  let updated = 0
  for (const item of items) {
    const existing = await db.getFromIndex('tracks', 'by-spotifyId', item.id)
    const matchKey = normalizeMatchKey(item.artists, item.name)
    if (existing) {
      const merged: LibraryTrack = {
        ...existing,
        title: item.name,
        artists: item.artists,
        album: item.album,
        durationMs: item.durationMs,
        bpm: item.bpm ?? existing.bpm,
        musicalKey: item.musicalKey ?? existing.musicalKey,
        artworkUrl: item.artworkUrl ?? existing.artworkUrl,
        matchKey,
      }
      await db.put('tracks', merged)
      updated++
    } else {
      const track: LibraryTrack = {
        id: crypto.randomUUID(),
        title: item.name,
        artists: item.artists,
        album: item.album,
        durationMs: item.durationMs,
        bpm: item.bpm,
        musicalKey: item.musicalKey,
        spotifyTrackId: item.id,
        source: 'spotify-likes',
        matchKey,
        hasAudio: false,
        artworkUrl: item.artworkUrl,
        addedAt: Date.now(),
      }
      await db.put('tracks', track)
      added++
    }
  }
  return { added, updated }
}

export async function attachUpload(
  file: File,
  matchedTrackId?: string,
): Promise<LibraryTrack> {
  const db = await getDb()
  let track: LibraryTrack | undefined
  const identity = await getFileIdentity(file)

  if (matchedTrackId) {
    track = await db.get('tracks', matchedTrackId)
  }

  if (!track) {
    track = {
      id: crypto.randomUUID(),
      title: identity.title,
      artists: identity.artists,
      album: identity.album,
      source: 'upload',
      matchKey: identity.matchKey,
      hasAudio: false,
      addedAt: Date.now(),
    }
  } else {
    track = {
      ...track,
      title: track.title || identity.title,
      artists: track.artists || identity.artists,
      album: track.album ?? identity.album,
      matchKey: track.matchKey || identity.matchKey,
    }
  }

  const durationMs = await readDurationMs(file)
  track = {
    ...track,
    durationMs: durationMs || track.durationMs,
    hasAudio: true,
  }
  await db.put('tracks', track)
  await db.put('audio', file, track.id)
  return track
}

export async function attachBlobToTrack(
  trackId: string,
  blob: Blob,
  filename: string,
): Promise<LibraryTrack> {
  const file = new File([blob], filename, { type: blob.type || 'audio/mpeg' })
  return attachUpload(file, trackId)
}

export async function importFilesBatch(
  files: FileList | File[],
): Promise<{ results: ImportFileResult[]; refreshed: LibraryTrack[] }> {
  const fileArr = Array.from(files).filter((f) =>
    /\.(mp3|wav|flac|ogg|m4a|aac)$/i.test(f.name),
  )
  const results: ImportFileResult[] = []
  for (const file of fileArr) {
    let current = await listTracks()
    const match = await findBestMatchForFile(file, current)
    const track = await attachUpload(file, match?.track.id)
    results.push({
      file: file.name,
      status: match ? 'matched' : 'new',
      trackTitle: track.title,
    })
    current = await listTracks()
  }
  const refreshed = await listTracks()
  return { results, refreshed }
}


function readDurationMs(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      const ms = Number.isFinite(audio.duration)
        ? Math.round(audio.duration * 1000)
        : 0
      URL.revokeObjectURL(url)
      resolve(ms)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(0)
    }
    audio.src = url
  })
}

export async function findBestMatchForFile(
  file: File,
  tracks: LibraryTrack[],
): Promise<{ track: LibraryTrack; score: number } | null> {
  const identity = await getFileIdentity(file)
  const fileKey = identity.matchKey

  let best: { track: LibraryTrack; score: number } | null = null
  for (const track of tracks) {
    if (track.hasAudio) continue
    const score = scoreMatch(fileKey, track.matchKey)
    if (score >= 0.6 && (!best || score > best.score)) {
      best = { track, score }
    }
  }
  return best
}

export async function libraryStats(): Promise<{
  total: number
  withAudio: number
  fromSpotify: number
  missing: number
}> {
  const all = await listTracks()
  return {
    total: all.length,
    withAudio: all.filter((t) => t.hasAudio).length,
    fromSpotify: all.filter((t) => t.source === 'spotify-likes').length,
    missing: all.filter((t) => !t.hasAudio).length,
  }
}
