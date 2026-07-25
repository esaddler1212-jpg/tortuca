import { Loader2, Music } from 'lucide-react'
import type { SpotifyPlaylist } from '../lib/spotify/types'
import type { DeckTrack } from '../lib/spotify/types'

interface PlaylistPanelProps {
  playlists: SpotifyPlaylist[]
  tracks: DeckTrack[]
  selectedPlaylistId: string | null
  loadingPlaylists: boolean
  loadingTracks: boolean
  onSelectPlaylist: (id: string) => void
  onLoadToDeck: (track: DeckTrack, deck: 'A' | 'B') => void
}

export function PlaylistPanel({
  playlists,
  tracks,
  selectedPlaylistId,
  loadingPlaylists,
  loadingTracks,
  onSelectPlaylist,
  onLoadToDeck,
}: PlaylistPanelProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-zinc-800 bg-zinc-900/50 md:w-80">
      <div className="border-b border-zinc-800 p-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Your playlists
        </h2>
        {loadingPlaylists ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <select
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
            value={selectedPlaylistId ?? ''}
            onChange={(e) => onSelectPlaylist(e.target.value)}
          >
            <option value="" disabled>
              Choose a playlist
            </option>
            {playlists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.tracks.total})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loadingTracks && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading tracks…
          </div>
        )}
        {!loadingTracks && tracks.length === 0 && selectedPlaylistId && (
          <p className="px-2 py-4 text-center text-sm text-zinc-500">No tracks found.</p>
        )}
        <ul className="space-y-1">
          {tracks.map((track) => (
            <li
              key={track.id}
              className="group rounded-lg border border-transparent px-2 py-2 hover:border-zinc-700 hover:bg-zinc-800/60"
            >
              <div className="flex gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-zinc-800 text-zinc-500">
                  <Music className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{track.name}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {track.artists.map((a) => a.name).join(', ')}
                    {track.bpm != null && (
                      <span className="ml-2 font-mono text-emerald-500/80">
                        {Math.round(track.bpm)} BPM
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onLoadToDeck(track, 'A')}
                  className="flex-1 rounded-md bg-zinc-700/80 py-1 text-xs font-medium hover:bg-emerald-600/80"
                >
                  Deck A
                </button>
                <button
                  type="button"
                  onClick={() => onLoadToDeck(track, 'B')}
                  className="flex-1 rounded-md bg-zinc-700/80 py-1 text-xs font-medium hover:bg-violet-600/80"
                >
                  Deck B
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
