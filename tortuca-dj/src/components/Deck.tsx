import { Pause, Play, RotateCcw } from 'lucide-react'
import type { LibraryTrack } from '../lib/library/types'
import { artistNamesFromLibrary, formatDuration } from '../lib/utils'

interface DeckProps {
  label: 'A' | 'B'
  track: LibraryTrack | null
  isPlaying: boolean
  positionMs: number
  onPlay: () => void
  onPause: () => void
  onRestart: () => void
}

function deckAccent(label: 'A' | 'B') {
  return label === 'A'
    ? {
        ring: 'ring-emerald-500/40',
        badge: 'bg-emerald-500/20 text-emerald-300',
        live: 'border-emerald-500/50',
      }
    : {
        ring: 'ring-violet-500/40',
        badge: 'bg-violet-500/20 text-violet-300',
        live: 'border-violet-500/50',
      }
}

export function Deck({
  label,
  track,
  isPlaying,
  positionMs,
  onPlay,
  onPause,
  onRestart,
}: DeckProps) {
  const colors = deckAccent(label)
  const img = track?.artworkUrl ?? null
  const duration = track?.durationMs ?? 0
  const progress =
    duration > 0 ? Math.min(100, (positionMs / duration) * 100) : 0

  return (
    <div
      className={`flex flex-1 flex-col rounded-2xl border bg-zinc-900/80 p-4 shadow-lg ${
        isPlaying ? colors.live : 'border-zinc-800'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${colors.badge}`}
        >
          DECK {label}
        </span>
        {isPlaying && (
          <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">
            Playing
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4">
        <div
          className={`relative h-40 w-40 rounded-full border-4 border-zinc-800 bg-zinc-950 shadow-inner ring-4 ${colors.ring} ${
            isPlaying ? 'vinyl-spin' : 'vinyl-spin vinyl-spin-paused'
          }`}
        >
          {img ? (
            <img
              src={img}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600">
              —
            </div>
          )}
          <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-700 bg-zinc-900" />
        </div>

        {track ? (
          <div className="w-full text-center">
            <p className="truncate text-lg font-semibold">{track.title}</p>
            <p className="truncate text-sm text-zinc-400">
              {artistNamesFromLibrary(track)}
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-500">
              {track.bpm != null && <span>{Math.round(track.bpm)} BPM</span>}
              {track.musicalKey && (
                <span className="ml-3">{track.musicalKey}</span>
              )}
              {duration > 0 && (
                <span className="ml-3">{formatDuration(duration)}</span>
              )}
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Load a track from your library</p>
        )}
      </div>

      {track && duration > 0 && (
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={!track}
          onClick={isPlaying ? onPause : onPlay}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition hover:bg-white disabled:opacity-30"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5" />
          )}
        </button>
        <button
          type="button"
          disabled={!track}
          onClick={onRestart}
          className="flex items-center gap-1 rounded-lg border border-zinc-600 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-400 disabled:opacity-30"
        >
          <RotateCcw className="h-4 w-4" />
          Restart
        </button>
      </div>
    </div>
  )
}
