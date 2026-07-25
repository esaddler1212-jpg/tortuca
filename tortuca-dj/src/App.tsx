import { useCallback, useEffect, useRef, useState } from 'react'
import { Crossfader } from './components/Crossfader'
import { Deck } from './components/Deck'
import { Header, LoginScreen } from './components/LoginScreen'
import { PlaylistPanel } from './components/PlaylistPanel'
import { useSpotifyAuth } from './hooks/useSpotifyAuth'
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer'
import {
  formatMusicalKey,
  getAudioFeatures,
  getPlaylistTracks,
  getUserPlaylists,
} from './lib/spotify/api'
import type { DeckTrack, SpotifyPlaylist } from './lib/spotify/types'
import { runCrossfade } from './lib/utils'

function App() {
  const { loading, isLoggedIn, userName, authError } = useSpotifyAuth()
  const { status, playUri, setVolume, pause } = useSpotifyPlayer()

  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [tracks, setTracks] = useState<DeckTrack[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [loadingTracks, setLoadingTracks] = useState(false)

  const [deckA, setDeckA] = useState<DeckTrack | null>(null)
  const [deckB, setDeckB] = useState<DeckTrack | null>(null)
  const [liveDeck, setLiveDeck] = useState<'A' | 'B'>('A')
  const [crossfader, setCrossfader] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [cueA, setCueA] = useState(false)
  const [cueB, setCueB] = useState(false)

  const previewARef = useRef<HTMLAudioElement | null>(null)
  const previewBRef = useRef<HTMLAudioElement | null>(null)

  const currentUri =
    status.state?.track_window.current_track.uri ?? null
  const isPlaying = status.state ? !status.state.paused : false
  const positionMs = status.state?.position ?? 0

  const liveTrack = liveDeck === 'A' ? deckA : deckB
  const isLiveOnA =
    liveDeck === 'A' && deckA != null && currentUri === deckA.uri
  const isLiveOnB =
    liveDeck === 'B' && deckB != null && currentUri === deckB.uri

  useEffect(() => {
    if (!isLoggedIn) return
    setLoadingPlaylists(true)
    void getUserPlaylists()
      .then(setPlaylists)
      .catch(console.error)
      .finally(() => setLoadingPlaylists(false))
  }, [isLoggedIn])

  const enrichTracks = useCallback(async (raw: DeckTrack[]) => {
    const ids = raw.map((t) => t.id)
    const features = await getAudioFeatures(ids)
    return raw.map((t) => {
      const f = features.get(t.id)
      return {
        ...t,
        bpm: f?.tempo,
        musicalKey: f
          ? formatMusicalKey(f.key, f.mode)
          : undefined,
      }
    })
  }, [])

  const loadPlaylist = useCallback(
    async (playlistId: string) => {
      setSelectedPlaylistId(playlistId)
      setLoadingTracks(true)
      try {
        const raw = await getPlaylistTracks(playlistId)
        const enriched = await enrichTracks(raw)
        setTracks(enriched)
      } catch (e) {
        console.error(e)
        setTracks([])
      } finally {
        setLoadingTracks(false)
      }
    },
    [enrichTracks],
  )

  const loadToDeck = useCallback(
    async (track: DeckTrack, deck: 'A' | 'B') => {
      let enriched = track
      if (track.bpm == null) {
        const [one] = await enrichTracks([track])
        enriched = one ?? track
      }
      if (deck === 'A') setDeckA(enriched)
      else setDeckB(enriched)
    },
    [enrichTracks],
  )

  const applyCrossfaderVolume = useCallback(
    (value: number, deck: 'A' | 'B') => {
      const t = value / 100
      const vol =
        deck === 'A' ? Math.cos((t * Math.PI) / 2) : Math.sin((t * Math.PI) / 2)
      void setVolume(Math.max(0.05, vol))
    },
    [setVolume],
  )

  useEffect(() => {
    if (status.ready) {
      applyCrossfaderVolume(crossfader, liveDeck)
    }
  }, [crossfader, liveDeck, status.ready, applyCrossfaderVolume])

  const stopPreviews = useCallback(() => {
    previewARef.current?.pause()
    previewBRef.current?.pause()
    setCueA(false)
    setCueB(false)
  }, [])

  const playDeck = useCallback(
    async (deck: 'A' | 'B') => {
      const track = deck === 'A' ? deckA : deckB
      if (!track || !status.deviceId) return
      stopPreviews()
      setLiveDeck(deck)
      await playUri(track.uri, 0)
      applyCrossfaderVolume(crossfader, deck)
    },
    [
      deckA,
      deckB,
      status.deviceId,
      stopPreviews,
      playUri,
      crossfader,
      applyCrossfaderVolume,
    ],
  )

  const toggleCuePreview = useCallback(
    (deck: 'A' | 'B') => {
      const track = deck === 'A' ? deckA : deckB
      const audioRef = deck === 'A' ? previewARef : previewBRef
      const setCue = deck === 'A' ? setCueA : setCueB
      const otherRef = deck === 'A' ? previewBRef : previewARef
      const otherSet = deck === 'A' ? setCueB : setCueA

      if (!track?.preview_url) return

      if (!audioRef.current) {
        audioRef.current = new Audio(track.preview_url)
        audioRef.current.loop = true
      } else if (audioRef.current.src !== track.preview_url) {
        audioRef.current.src = track.preview_url
      }

      const playing = deck === 'A' ? cueA : cueB
      if (playing) {
        audioRef.current.pause()
        setCue(false)
      } else {
        otherRef.current?.pause()
        otherSet(false)
        void audioRef.current.play()
        setCue(true)
      }
    },
    [deckA, deckB, cueA, cueB],
  )

  const crossfadeToOther = useCallback(async () => {
    const target: 'A' | 'B' = liveDeck === 'A' ? 'B' : 'A'
    const targetTrack = target === 'A' ? deckA : deckB
    if (!targetTrack || !status.deviceId || transitioning) return

    setTransitioning(true)
    stopPreviews()

    const endCross = target === 'B' ? 100 : 0

    await runCrossfade(0.8, 0.15, 1200, (v) => void setVolume(v))

    setLiveDeck(target)
    await playUri(targetTrack.uri, 0)

    await runCrossfade(0.15, 0.85, 1200, (v) => void setVolume(v))

    setCrossfader(endCross)
    setTransitioning(false)
  }, [
    liveDeck,
    deckA,
    deckB,
    status.deviceId,
    transitioning,
    stopPreviews,
    crossfader,
    setVolume,
    playUri,
  ])

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center text-zinc-400">
        Loading…
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginScreen authError={authError} />
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header userName={userName} />

      {!status.ready && !status.error && (
        <div className="bg-zinc-900 px-4 py-2 text-center text-sm text-zinc-400">
          Connecting Spotify player…
        </div>
      )}
      {status.error && (
        <div className="bg-red-950/50 px-4 py-2 text-center text-sm text-red-200">
          {status.error}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <PlaylistPanel
          playlists={playlists}
          tracks={tracks}
          selectedPlaylistId={selectedPlaylistId}
          loadingPlaylists={loadingPlaylists}
          loadingTracks={loadingTracks}
          onSelectPlaylist={(id) => void loadPlaylist(id)}
          onLoadToDeck={(t, d) => void loadToDeck(t, d)}
        />

        <main className="flex min-h-0 flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 flex-col gap-4 lg:flex-row">
            <Deck
              label="A"
              track={deckA}
              isLive={isLiveOnA || (liveDeck === 'A' && isPlaying)}
              isPlaying={isLiveOnA && isPlaying}
              positionMs={isLiveOnA ? positionMs : 0}
              onPlay={() => void playDeck('A')}
              onPause={() => void pause()}
              onCuePreview={() => toggleCuePreview('A')}
              cuePreviewActive={cueA}
            />
            <Deck
              label="B"
              track={deckB}
              isLive={isLiveOnB || (liveDeck === 'B' && isPlaying)}
              isPlaying={isLiveOnB && isPlaying}
              positionMs={isLiveOnB ? positionMs : 0}
              onPlay={() => void playDeck('B')}
              onPause={() => void pause()}
              onCuePreview={() => toggleCuePreview('B')}
              cuePreviewActive={cueB}
            />
          </div>

          <Crossfader
            value={crossfader}
            onChange={(v) => {
              setCrossfader(v)
              applyCrossfaderVolume(v, liveDeck)
            }}
            onTransition={() => void crossfadeToOther()}
            transitioning={transitioning}
          />

          {liveTrack && (
            <p className="text-center text-xs text-zinc-600">
              Now focusing deck {liveDeck}: {liveTrack.name}
            </p>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
