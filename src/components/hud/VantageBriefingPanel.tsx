import { ExternalLink, Square, Volume2 } from "lucide-react";
import { HudFrame } from "./HudFrame";
import { useVoiceOutput } from "../../hooks/useVoiceOutput";

/** The Vantage Point briefing: big picture across ECS Network, readable aloud. */
export function VantageBriefingPanel({
  lines,
  spoken,
  sourceLabel,
  sourceUrl,
}: {
  lines: { label: string; text: string }[];
  spoken: string;
  /** "Today's paper" when the real Vantage Point edition is driving this, else "Iris's briefing". */
  sourceLabel?: string;
  /** Link to the published paper, shown only when it's actually the one in use. */
  sourceUrl?: string;
}) {
  const voice = useVoiceOutput();
  return (
    <HudFrame title="Vantage Point briefing" tag={sourceLabel ?? "Big picture"}>
      <dl className="space-y-2.5">
        {lines.map((l) => (
          <div key={l.label}>
            <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/60">{l.label}</dt>
            <dd className="text-sm text-cyan-50/90">{l.text}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {voice.supported && (
          <button type="button" className="btn-gold w-full sm:w-auto" onClick={() => (voice.speaking ? voice.stop() : voice.speak(spoken, { force: true }))}>
            {voice.speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {voice.speaking ? "Stop" : "Read briefing"}
          </button>
        )}
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-cyan-300 hover:text-cyan-100">
            Open today's paper <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </HudFrame>
  );
}
