import { IRIS_CAPTAIN, IRIS_TEAM } from "../../../shared/irisTeam";
import { HudFrame } from "./HudFrame";

export function IrisTeamPanel() {
  return (
    <HudFrame title="Iris team" tag="Reports to E">
      <div className="flex items-center gap-3 rounded-md border border-cyan-400/25 bg-cyan-950/20 px-3 py-2 mb-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-300/50 font-display text-sm text-cyan-200"
          style={{ boxShadow: "0 0 20px rgb(34 211 238 / 0.25)" }}
        >
          IR
        </div>
        <div>
          <p className="font-display text-sm text-cyan-100">{IRIS_CAPTAIN.name}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/60">{IRIS_CAPTAIN.title}</p>
        </div>
      </div>
      <p className="text-xs text-cyan-100/70 mb-2">
        Specialists report to Iris; she delegates and speaks for the team. Ask by voice — e.g. &quot;have Scout research…&quot; or &quot;what does Sentinel see on Pulse?&quot;
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {IRIS_TEAM.map((s) => (
          <li key={s.id} className="hud-tile border-l-2 pl-2" style={{ borderLeftColor: s.color }}>
            <p className="font-mono text-[11px] uppercase tracking-wide" style={{ color: s.color }}>
              {s.name}
            </p>
            <p className="text-[11px] text-cyan-100/80">{s.title}</p>
            <p className="text-[10px] text-cyan-400/45 mt-0.5 line-clamp-2">{s.delegateWhen}</p>
          </li>
        ))}
      </ul>
    </HudFrame>
  );
}
