import { upsertSpotifyLikeTracks } from '../library/db'
import {
  formatMusicalKey,
  getAudioFeatures,
  getSavedTracks,
} from './api'

export async function importSpotifyLikes(): Promise<{
  added: number
  updated: number
  total: number
}> {
  const saved = await getSavedTracks()
  const features = await getAudioFeatures(saved.map((t) => t.id))

  const items = saved.map((t) => {
    const f = features.get(t.id)
    return {
      id: t.id,
      name: t.name,
      artists: t.artists.map((a) => a.name).join(', '),
      album: t.album.name,
      durationMs: t.duration_ms,
      bpm: f?.tempo,
      musicalKey: f ? formatMusicalKey(f.key, f.mode) : undefined,
      artworkUrl: t.album.images[0]?.url,
    }
  })

  const { added, updated } = await upsertSpotifyLikeTracks(items)
  return { added, updated, total: saved.length }
}
