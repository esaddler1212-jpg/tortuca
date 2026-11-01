import { Square, Volume2 } from "lucide-react";
import { HudFrame } from "./HudFrame";
import { useVoiceOutput } from "../../hooks/useVoiceOutput";

/** The Vantage Point briefing: big picture across ECS Network, readable aloud. */
export function VantageBriefingPanel({
  lines,
  spoken,
}: {
  lines: { label: string; text: string }[];
  spoken: string;
}) {
  const voice = useVoiceOutput();
  return (
    <HudFrame title="Vantage Point briefing" tag="Big picture">
      <dl className="space-y-2.5">
        {lines.map((l) => (
          <div key={l.label}>
            <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/60">{l.label}</dt>
            <dd className="text-sm text-cyan-50/90">{l.text}</dd>
          </div>
        ))}
      </dl>
      {voice.supported && (
        <button
          type="button"
          className="btn-gold mt-4 w-full sm:w-auto"
          onClick={() => (voice.speaking ? voice.stop() : voice.speak(spoken, { force: true }))}
        >
          {voice.speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {voice.speaking ? "Stop" : "Read briefing"}
        </button>
      )}
    </HudFrame>
  );
}
