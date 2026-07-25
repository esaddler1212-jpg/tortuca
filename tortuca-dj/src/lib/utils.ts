import type { LibraryTrack } from './library/types'

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function artistNamesFromLibrary(track: LibraryTrack | null): string {
  if (!track) return ''
  return track.artists
}
