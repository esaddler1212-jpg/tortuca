export interface SpotifyImage {
  url: string
  height: number | null
  width: number | null
}

export interface SpotifyArtist {
  id: string
  name: string
}

export interface SpotifyAlbum {
  id: string
  name: string
  images: SpotifyImage[]
}

export interface SpotifyTrack {
  id: string
  name: string
  uri: string
  duration_ms: number
  preview_url: string | null
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  explicit: boolean
}

export interface PlaylistTrackItem {
  track: SpotifyTrack | null
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  images: SpotifyImage[]
  tracks: { total: number }
  owner: { display_name: string }
}

export interface AudioFeatures {
  id: string
  tempo: number
  key: number
  mode: number
  energy: number
  danceability: number
}

export interface DeckTrack extends SpotifyTrack {
  bpm?: number
  musicalKey?: string
}

export interface TokenBundle {
  access_token: string
  refresh_token: string
  expires_at: number
}

declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume?: number
      }) => SpotifyPlayerInstance
    }
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

export interface SpotifyPlayerInstance {
  connect: () => Promise<boolean>
  disconnect: () => void
  addListener: (
    event: string,
    callback: (state: unknown) => void,
  ) => void
  removeListener: (event: string) => void
  getCurrentState: () => Promise<PlaybackState | null>
  setVolume: (volume: number) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  togglePlay: () => Promise<void>
  seek: (position_ms: number) => Promise<void>
  _options?: { id?: string }
}

export interface PlaybackState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      id: string
      name: string
      uri: string
      duration_ms: number
      artists: { name: string }[]
      album: { images: SpotifyImage[]; name: string }
    }
  }
}
