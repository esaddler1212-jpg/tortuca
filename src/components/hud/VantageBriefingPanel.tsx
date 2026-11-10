import { Square, Volume2 } from "lucide-react";
import { HudFrame } from "./HudFrame";
import { useVoiceOutput } from "../../hooks/useVoiceOutput";
import { VantageDebriefImport } from "../VantageDebriefImport";
import type { HubState } from "../../../shared/hub";
import { vantageDebriefForDay, spokenVantageDebrief } from "../../../shared/vantageDebrief";

/** The Vantage Point briefing: big picture across ECS Network, readable aloud. */
export function VantageBriefingPanel({
  lines,
  spoken,
  hub,
  updateHub,
  today,
  timeZone,
  onAddTodo,
}: {
  lines: { label: string; text: string }[];
  spoken: string;
  hub: HubState;
  updateHub: (fn: (h: HubState) => HubState) => void;
  today: string;
  timeZone: string;
  onAddTodo?: (title: string) => void;
}) {
  const voice = useVoiceOutput();
  const imported = vantageDebriefForDay(hub.vantageDebrief, today);
  const readAloud = imported ? spokenVantageDebrief(imported.text) : spoken;
  return (
    <HudFrame title="Vantage Point briefing" tag="Big picture">
      <VantageDebriefImport hub={hub} update={updateHub} today={today} timeZone={timeZone} onAddTodo={onAddTodo} compact />
      {imported ? (
        <p className="mt-3 text-xs text-cyan-200/70">
          Auto-generated lines below are still from live IRIS data; Brief me and Read briefing use your imported debrief when saved for today.
        </p>
      ) : null}
      <dl className="mt-3 space-y-2.5">
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
          onClick={() => (voice.speaking ? voice.stop() : voice.speak(readAloud, { force: true }))}
        >
          {voice.speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {voice.speaking ? "Stop" : imported ? "Read imported debrief" : "Read briefing"}
        </button>
      )}
    </HudFrame>
  );
}
