import { useRef } from 'react'
import {
  ExternalLink,
  FolderOpen,
  Paperclip,
} from 'lucide-react'
import type { LibraryTrack } from '../lib/library/types'
import { openSearch } from '../lib/searchLinks'

interface MissingQueueProps {
  tracks: LibraryTrack[]
  onAttachFile: (trackId: string, file: File) => void
}

export function MissingQueue({ tracks, onAttachFile }: MissingQueueProps) {
  const attachRef = useRef<HTMLInputElement>(null)
  const pendingTrackId = useRef<string | null>(null)

  const missing = tracks
    .filter((t) => !t.hasAudio)
    .sort((a, b) => a.title.localeCompare(b.title))

  if (missing.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-zinc-500">
        Nothing missing — every catalog entry has audio. Sync Spotify likes to
        build a wishlist, or you are all set.
      </p>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-2">
      <input
        ref={attachRef}
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          const id = pendingTrackId.current
          if (file && id) onAttachFile(id, file)
          pendingTrackId.current = null
          e.target.value = ''
        }}
      />
      <p className="mb-2 px-2 text-xs text-zinc-500">
        {missing.length} track{missing.length === 1 ? '' : 's'} need a file.
        Search to buy or locate audio, then attach your copy.
      </p>
      <ul className="space-y-2">
        {missing.map((track) => (
          <li
            key={track.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
          >
            <p className="text-sm font-medium">{track.title}</p>
            <p className="text-xs text-zinc-500">{track.artists}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <SearchChip
                label="YouTube"
                onClick={() => openSearch('youtube', track.artists, track.title)}
              />
              <SearchChip
                label="Bandcamp"
                onClick={() => openSearch('bandcamp', track.artists, track.title)}
              />
              <SearchChip
                label="Discogs"
                onClick={() => openSearch('discogs', track.artists, track.title)}
              />
              <SearchChip
                label="Web"
                onClick={() =>
                  openSearch('duckduckgo', track.artists, track.title)
                }
              />
            </div>
            <button
              type="button"
              onClick={() => {
                pendingTrackId.current = track.id
                attachRef.current?.click()
              }}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-zinc-600 py-1.5 text-xs font-medium text-zinc-200 hover:border-emerald-500/50 hover:text-emerald-300"
            >
              <Paperclip className="h-3.5 w-3.5" />
              Attach audio file
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SearchChip({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-0.5 rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300 hover:bg-zinc-700"
    >
      {label}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </button>
  )
}

export function FolderImportHint() {
  return (
    <p className="flex items-center gap-1 text-[11px] text-zinc-600">
      <FolderOpen className="h-3 w-3" />
      Folder import reads ID3 tags for matching.
    </p>
  )
}
