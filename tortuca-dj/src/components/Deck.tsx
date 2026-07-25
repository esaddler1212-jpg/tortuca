import { Headphones, Pause, Play, RotateCcw } from 'lucide-react'
import type { DeckTrack } from '../lib/spotify/types'
import { artistNames, formatDuration, trackImage } from '../lib/utils'

interface DeckProps {
  label: 'A' | 'B'
  track: DeckTrack | null
  isLive: boolean
  isPlaying: boolean
  positionMs: number
  onPlay: () => void
  onPause: () => void
  onCuePreview: () => void
  cuePreviewActive: boolean
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
  isLive,
  isPlaying,
  positionMs,
  onPlay,
  onPause,
  onCuePreview,
  cuePreviewActive,
}: DeckProps) {
  const colors = deckAccent(label)
  const img = trackImage(track)
  const progress =
    track && track.duration_ms > 0
      ? Math.min(100, (positionMs / track.duration_ms) * 100)
      : 0

  return (
    <div
      className={`flex flex-1 flex-col rounded-2xl border bg-zinc-900/80 p-4 shadow-lg ${
        isLive ? colors.live : 'border-zinc-800'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${colors.badge}`}
        >
          DECK {label}
        </span>
        {isLive && (
          <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">
            Live
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4">
        <div
          className={`relative h-40 w-40 rounded-full border-4 border-zinc-800 bg-zinc-950 shadow-inner ring-4 ${colors.ring} ${
            isLive && isPlaying ? 'vinyl-spin' : 'vinyl-spin vinyl-spin-paused'
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
            <p className="truncate text-lg font-semibold">{track.name}</p>
            <p className="truncate text-sm text-zinc-400">{artistNames(track)}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">
              {track.bpm != null && <span>{Math.round(track.bpm)} BPM</span>}
              {track.musicalKey && (
                <span className="ml-3">{track.musicalKey}</span>
              )}
              <span className="ml-3">{formatDuration(track.duration_ms)}</span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Load a track from your playlist</p>
        )}
      </div>

      {track && (
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
          onClick={isPlaying && isLive ? onPause : onPlay}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition hover:bg-white disabled:opacity-30"
        >
          {isPlaying && isLive ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5" />
          )}
        </button>
        <button
          type="button"
          disabled={!track?.preview_url}
          onClick={onCuePreview}
          className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-30 ${
            cuePreviewActive
              ? 'border-amber-400/50 bg-amber-500/20 text-amber-100'
              : 'border-zinc-600 text-zinc-300 hover:border-zinc-400'
          }`}
          title="30s preview in browser (headphone cue)"
        >
          <Headphones className="h-4 w-4" />
          Cue preview
        </button>
        <button
          type="button"
          disabled={!track || !isLive}
          onClick={() => onPlay()}
          className="flex items-center gap-1 rounded-lg border border-zinc-600 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-400 disabled:opacity-30"
        >
          <RotateCcw className="h-4 w-4" />
          Restart
        </button>
      </div>
    </div>
  )
}
