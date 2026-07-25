export type TrackSource = 'spotify-likes' | 'upload' | 'manual' | 'navidrome'

export interface LibraryTrack {
  id: string
  title: string
  artists: string
  album?: string
  durationMs?: number
  bpm?: number
  musicalKey?: string
  spotifyTrackId?: string
  source: TrackSource
  /** Normalized title+artist for fuzzy file matching */
  matchKey: string
  hasAudio: boolean
  artworkUrl?: string
  addedAt: number
}

export type DeckId = 'A' | 'B'

export interface DeckPlaybackState {
  trackId: string | null
  isPlaying: boolean
  positionMs: number
  durationMs: number
}
