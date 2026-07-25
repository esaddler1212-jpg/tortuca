import { useCallback, useState } from 'react'
import { Crossfader } from './components/Crossfader'
import { Deck } from './components/Deck'
import { LibraryPanel } from './components/LibraryPanel'
import { Header, WelcomeBanner } from './components/LoginScreen'
import { useDeckEngine } from './hooks/useDeckEngine'
import { useLibrary } from './hooks/useLibrary'
import { useSpotifyAuth } from './hooks/useSpotifyAuth'
import type { LibraryTrack } from './lib/library/types'
import { beginLogin } from './lib/spotify/auth'
import { importSpotifyLikes } from './lib/spotify/importLikes'

function App() {
  const { loading: authLoading, isLoggedIn, userName, authError } =
    useSpotifyAuth()
  const { tracks, stats, loading: libraryLoading, refresh, importFiles } =
    useLibrary()
  const engine = useDeckEngine()

  const [deckATrack, setDeckATrack] = useState<LibraryTrack | null>(null)
  const [deckBTrack, setDeckBTrack] = useState<LibraryTrack | null>(null)
  const [importingLikes, setImportingLikes] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  const loadToDeck = useCallback(
    async (track: LibraryTrack, deck: 'A' | 'B') => {
      if (!track.hasAudio) return
      try {
        await engine.loadTrack(deck, track.id)
        if (deck === 'A') setDeckATrack(track)
        else setDeckBTrack(track)
      } catch (e) {
        console.error(e)
        alert(
          e instanceof Error
            ? e.message
            : 'Could not load audio for this track',
        )
      }
    },
    [engine],
  )

  const handleImportLikes = useCallback(async () => {
    setImportingLikes(true)
    setImportMessage(null)
    try {
      const result = await importSpotifyLikes()
      await refresh()
      setImportMessage(
        `Synced ${result.total} liked songs (${result.added} new, ${result.updated} updated). Add your audio files to match titles.`,
      )
    } catch (e) {
      setImportMessage(
        e instanceof Error ? e.message : 'Spotify import failed',
      )
    } finally {
      setImportingLikes(false)
    }
  }, [refresh])

  const crossfadeToOther = useCallback(async () => {
    const target = engine.crossfader < 50 ? 'B' : 'A'
    const targetTrack = target === 'A' ? deckATrack : deckBTrack
    if (!targetTrack?.hasAudio || transitioning) return
    if (target === 'A' && !engine.deckAId) await loadToDeck(targetTrack, 'A')
    if (target === 'B' && !engine.deckBId) await loadToDeck(targetTrack, 'B')
    setTransitioning(true)
    await engine.crossfadeTo(target, 2000)
    setTransitioning(false)
  }, [engine, deckATrack, deckBTrack, transitioning, loadToDeck])

  if (authLoading) {
    return (
      <div className="flex min-h-full items-center justify-center text-zinc-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header userName={userName} spotifyConnected={isLoggedIn} />
      <WelcomeBanner authError={authError} />
      {importMessage && (
        <div className="bg-emerald-950/40 px-4 py-2 text-center text-sm text-emerald-100">
          {importMessage}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <LibraryPanel
          tracks={tracks}
          stats={stats}
          loading={libraryLoading}
          importingLikes={importingLikes}
          spotifyConnected={isLoggedIn}
          onImportFiles={(files) => void importFiles(files)}
          onImportSpotifyLikes={() => void handleImportLikes()}
          onConnectSpotify={() => void beginLogin()}
          onLoadToDeck={(t, d) => void loadToDeck(t, d)}
        />

        <main className="flex min-h-0 flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 flex-col gap-4 lg:flex-row">
            <Deck
              label="A"
              track={deckATrack}
              isPlaying={engine.playingA}
              positionMs={engine.positionA}
              onPlay={() => engine.startDeck('A', engine.positionA)}
              onPause={() => engine.pauseDeck('A')}
              onRestart={() => engine.restartDeck('A')}
            />
            <Deck
              label="B"
              track={deckBTrack}
              isPlaying={engine.playingB}
              positionMs={engine.positionB}
              onPlay={() => engine.startDeck('B', engine.positionB)}
              onPause={() => engine.pauseDeck('B')}
              onRestart={() => engine.restartDeck('B')}
            />
          </div>

          <Crossfader
            value={engine.crossfader}
            onChange={(v) => {
              engine.setCrossfader(v)
              engine.applyCrossfader(v)
            }}
            onTransition={() => void crossfadeToOther()}
            transitioning={transitioning}
          />
        </main>
      </div>
    </div>
  )
}

export default App
