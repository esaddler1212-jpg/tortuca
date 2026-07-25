import { useCallback, useEffect, useState } from 'react'
import { Download, Loader2, Server } from 'lucide-react'
import {
  attachBlobToTrack,
  attachUpload,
  findBestMatchForFile,
  listTracks,
} from '../lib/library/db'
import {
  type NavidromeConfig,
  type NavidromeSong,
  coverArtUrl,
  fetchNavidromeStream,
  loadNavidromeConfig,
  pingNavidrome,
  saveNavidromeConfig,
  searchNavidrome,
} from '../lib/navidrome/client'

interface NavidromePanelProps {
  onImported: () => void
}

export function NavidromePanel({ onImported }: NavidromePanelProps) {
  const [config, setConfig] = useState<NavidromeConfig>(() =>
    loadNavidromeConfig() ?? { serverUrl: '', username: '', token: '' },
  )
  const [connected, setConnected] = useState<boolean | null>(null)
  const [query, setQuery] = useState('')
  const [songs, setSongs] = useState<NavidromeSong[]>([])
  const [searching, setSearching] = useState(false)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = useCallback(async () => {
    setError(null)
    saveNavidromeConfig(config)
    try {
      const ok = await pingNavidrome(config)
      setConnected(ok)
      if (!ok) setError('Could not reach server or invalid credentials.')
    } catch (e) {
      setConnected(false)
      setError(
        e instanceof Error
          ? `${e.message} — check URL and CORS on your Navidrome server.`
          : 'Connection failed (often browser CORS).',
      )
    }
  }, [config])

  useEffect(() => {
    if (config.serverUrl && config.username && config.token) {
      void testConnection()
    }
    // Initial connection test when saved config exists
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setError(null)
    try {
      saveNavidromeConfig(config)
      const results = await searchNavidrome(config, query.trim())
      setSongs(results)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
      setSongs([])
    } finally {
      setSearching(false)
    }
  }

  const importSong = async (song: NavidromeSong) => {
    setImportingId(song.id)
    setError(null)
    try {
      const blob = await fetchNavidromeStream(config, song.id)
      const ext = blob.type.includes('flac')
        ? 'flac'
        : blob.type.includes('mpeg')
          ? 'mp3'
          : 'audio'
      const filename = `${song.artist} - ${song.title}.${ext}`
      const file = new File([blob], filename, { type: blob.type })
      const tracks = await listTracks()
      const match = await findBestMatchForFile(file, tracks)
      if (match) {
        await attachBlobToTrack(match.track.id, blob, filename)
      } else {
        await attachUpload(file)
      }
      onImported()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImportingId(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="space-y-2 border-b border-zinc-800 p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          <Server className="h-4 w-4" />
          Navidrome / Subsonic
        </div>
        <p className="text-xs text-zinc-500">
          Import tracks from your home server into this browser library. The
          server must allow CORS from this app&apos;s origin.
        </p>
        <input
          placeholder="https://music.example.com"
          value={config.serverUrl}
          onChange={(e) =>
            setConfig((c) => ({ ...c, serverUrl: e.target.value }))
          }
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
        />
        <div className="flex gap-2">
          <input
            placeholder="Username"
            value={config.username}
            onChange={(e) =>
              setConfig((c) => ({ ...c, username: e.target.value }))
            }
            className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm outline-none"
          />
          <input
            type="password"
            placeholder="App token"
            value={config.token}
            onChange={(e) =>
              setConfig((c) => ({ ...c, token: e.target.value }))
            }
            className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => void testConnection()}
          className="w-full rounded-lg border border-zinc-600 py-1.5 text-xs text-zinc-300 hover:border-zinc-400"
        >
          {connected === true
            ? 'Connected'
            : connected === false
              ? 'Retry connection'
              : 'Test connection'}
        </button>
      </div>

      <div className="flex gap-2 border-b border-zinc-800 p-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void runSearch()}
          placeholder="Search your server…"
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm outline-none"
        />
        <button
          type="button"
          disabled={searching || connected === false}
          onClick={() => void runSearch()}
          className="rounded-lg bg-zinc-700 px-3 text-sm disabled:opacity-40"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
        </button>
      </div>

      {error && (
        <p className="bg-red-950/30 px-3 py-2 text-xs text-red-200">{error}</p>
      )}

      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {songs.map((song) => (
          <li
            key={song.id}
            className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-zinc-800/50"
          >
            {song.coverArt && config.serverUrl && (
              <img
                src={coverArtUrl(config, song.coverArt)}
                alt=""
                className="h-10 w-10 rounded object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{song.title}</p>
              <p className="truncate text-xs text-zinc-500">
                {song.artist} · {song.album}
              </p>
            </div>
            <button
              type="button"
              disabled={importingId === song.id}
              onClick={() => void importSong(song)}
              className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-600/80 px-2 py-1 text-xs font-medium disabled:opacity-50"
            >
              {importingId === song.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Import
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
