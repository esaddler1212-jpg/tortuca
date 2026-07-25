import { useRef, useState } from 'react'
import {
  AlertCircle,
  FolderOpen,
  HardDriveUpload,
  Heart,
  Loader2,
  Music,
  Search,
} from 'lucide-react'
import type { LibraryTrack } from '../lib/library/types'
import { FolderImportHint, MissingQueue } from './MissingQueue'
import { NavidromePanel } from './NavidromePanel'

type SidebarTab = 'library' | 'missing' | 'server'

interface LibraryPanelProps {
  tracks: LibraryTrack[]
  stats: { total: number; withAudio: number; fromSpotify: number; missing: number }
  loading: boolean
  importing: boolean
  importingLikes: boolean
  importSummary: string | null
  spotifyConnected: boolean
  onImportFiles: (files: FileList) => void
  onImportSpotifyLikes: () => void
  onConnectSpotify: () => void
  onLoadToDeck: (track: LibraryTrack, deck: 'A' | 'B') => void
  onAttachFile: (trackId: string, file: File) => void
  onLibraryRefresh: () => void
}

export function LibraryPanel({
  tracks,
  stats,
  loading,
  importing,
  importingLikes,
  importSummary,
  spotifyConnected,
  onImportFiles,
  onImportSpotifyLikes,
  onConnectSpotify,
  onLoadToDeck,
  onAttachFile,
  onLibraryRefresh,
}: LibraryPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const folderRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<SidebarTab>('library')
  const [query, setQuery] = useState('')
  const [showReadyOnly, setShowReadyOnly] = useState(false)

  const filtered = tracks.filter((t) => {
    if (showReadyOnly && !t.hasAudio) return false
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      t.title.toLowerCase().includes(q) ||
      t.artists.toLowerCase().includes(q)
    )
  })

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-zinc-800 bg-zinc-900/50 md:w-[26rem]">
      <div className="space-y-3 border-b border-zinc-800 p-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Private library
        </h2>

        <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
          <span>{stats.total} tracks</span>
          <span>·</span>
          <span className="text-emerald-400">{stats.withAudio} ready</span>
          {stats.missing > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-500">{stats.missing} missing</span>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onImportFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={folderRef}
          type="file"
          // @ts-expect-error webkitdirectory is non-standard but widely supported
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onImportFiles(e.target.files)
            e.target.value = ''
          }}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-1 rounded-lg border border-zinc-600 bg-zinc-800/80 px-2 py-2 text-xs font-medium hover:border-emerald-500/50 disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <HardDriveUpload className="h-4 w-4" />
            )}
            Files
          </button>
          <button
            type="button"
            disabled={importing}
            onClick={() => folderRef.current?.click()}
            className="flex items-center justify-center gap-1 rounded-lg border border-zinc-600 bg-zinc-800/80 px-2 py-2 text-xs font-medium hover:border-emerald-500/50 disabled:opacity-50"
          >
            <FolderOpen className="h-4 w-4" />
            Folder
          </button>
        </div>
        <FolderImportHint />

        {importSummary && (
          <p className="rounded-lg bg-zinc-800/80 px-2 py-1.5 text-xs text-emerald-200/90">
            {importSummary}
          </p>
        )}

        {spotifyConnected ? (
          <button
            type="button"
            disabled={importingLikes}
            onClick={onImportSpotifyLikes}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1DB954]/15 px-3 py-2 text-sm font-medium text-[#1ed760] ring-1 ring-[#1DB954]/40 hover:bg-[#1DB954]/25 disabled:opacity-50"
          >
            {importingLikes ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            Sync Spotify likes
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnectSpotify}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#1DB954]/30 px-3 py-2 text-sm text-[#1ed760] hover:bg-[#1DB954]/10"
          >
            Connect Spotify to import likes
          </button>
        )}
      </div>

      <div className="flex border-b border-zinc-800 text-xs">
        <TabButton
          active={tab === 'library'}
          onClick={() => setTab('library')}
          label="All"
        />
        <TabButton
          active={tab === 'missing'}
          onClick={() => setTab('missing')}
          label={`Missing${stats.missing ? ` (${stats.missing})` : ''}`}
        />
        <TabButton
          active={tab === 'server'}
          onClick={() => setTab('server')}
          label="Server"
        />
      </div>

      {tab === 'library' && (
        <>
          <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search library…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
            />
            <label className="flex shrink-0 items-center gap-1 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={showReadyOnly}
                onChange={(e) => setShowReadyOnly(e.target.checked)}
                className="rounded border-zinc-600"
              />
              Ready
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading library…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <p className="flex items-center justify-center gap-2 px-2 py-6 text-center text-sm text-zinc-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                No tracks yet. Sync likes or import files.
              </p>
            )}
            <ul className="space-y-1">
              {filtered.map((track) => (
                <li
                  key={track.id}
                  className="group rounded-lg border border-transparent px-2 py-2 hover:border-zinc-700 hover:bg-zinc-800/60"
                >
                  <div className="flex gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-800 text-zinc-500">
                      {track.artworkUrl ? (
                        <img
                          src={track.artworkUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Music className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{track.title}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {track.artists}
                      </p>
                      <p className="text-xs">
                        {track.hasAudio ? (
                          <span className="text-emerald-500">Ready</span>
                        ) : (
                          <span className="text-amber-500/90">Needs file</span>
                        )}
                        {track.bpm != null && (
                          <span className="ml-2 font-mono text-zinc-600">
                            {Math.round(track.bpm)} BPM
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      disabled={!track.hasAudio}
                      onClick={() => onLoadToDeck(track, 'A')}
                      className="flex-1 rounded-md bg-zinc-700/80 py-1 text-xs font-medium hover:bg-emerald-600/80 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Deck A
                    </button>
                    <button
                      type="button"
                      disabled={!track.hasAudio}
                      onClick={() => onLoadToDeck(track, 'B')}
                      className="flex-1 rounded-md bg-zinc-700/80 py-1 text-xs font-medium hover:bg-violet-600/80 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Deck B
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {tab === 'missing' && (
        <MissingQueue tracks={tracks} onAttachFile={onAttachFile} />
      )}

      {tab === 'server' && (
        <NavidromePanel onImported={onLibraryRefresh} />
      )}
    </aside>
  )
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 font-medium transition ${
        active
          ? 'border-b-2 border-emerald-500 text-zinc-100'
          : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {label}
    </button>
  )
}
