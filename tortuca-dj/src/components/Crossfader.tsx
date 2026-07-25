interface CrossfaderProps {
  value: number
  onChange: (value: number) => void
  onTransition: () => void
  transitioning: boolean
}

export function Crossfader({
  value,
  onChange,
  onTransition,
  transitioning,
}: CrossfaderProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-2 py-6 md:px-4">
      <div className="flex w-full max-w-xs items-center gap-3 text-xs font-mono uppercase tracking-wider text-zinc-500">
        <span>A</span>
        <div className="relative h-10 flex-1">
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="crossfader-input absolute inset-0 w-full cursor-pointer appearance-none bg-transparent"
            aria-label="Crossfader"
          />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-700" />
          <div
            className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-sm bg-zinc-100 shadow"
            style={{ left: `calc(${value}% - 6px)` }}
          />
        </div>
        <span>B</span>
      </div>

      <button
        type="button"
        onClick={onTransition}
        disabled={transitioning}
        className="rounded-xl bg-gradient-to-r from-emerald-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:brightness-110 disabled:opacity-50"
      >
        {transitioning ? 'Mixing…' : 'Crossfade to other deck'}
      </button>

      <p className="max-w-xs text-center text-xs text-zinc-500">
        Full tracks play through one Spotify stream. Use cue preview on the idle deck,
        then crossfade to hand off playback.
      </p>

      <style>{`
        .crossfader-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 28px;
          background: #f4f4f5;
          border-radius: 2px;
          cursor: grab;
        }
        .crossfader-input::-moz-range-thumb {
          width: 14px;
          height: 28px;
          background: #f4f4f5;
          border-radius: 2px;
          border: none;
          cursor: grab;
        }
      `}</style>
    </div>
  )
}
