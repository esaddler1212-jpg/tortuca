import type { ReactNode } from "react";
import type { Gauge, GaugeId } from "../../../shared/hudGauges";

const AMBER = "#ffb547";
const CX = 200;
const CY = 230;
const R = 170;
const SPAN = 34; // degrees either side of each gauge's centre

/** Where each gauge sits (SVG angle, y down) and where its callout lands. */
const LAYOUT: Record<GaugeId, { mid: number; elbow: [number, number]; end: [number, number]; corner: string; align: "left" | "right" }> = {
  today: { mid: 225, elbow: [54, 52], end: [4, 52], corner: "left-0 top-0", align: "left" },
  inbox: { mid: 315, elbow: [346, 52], end: [396, 52], corner: "right-0 top-0", align: "right" },
  vitals: { mid: 135, elbow: [54, 408], end: [4, 408], corner: "left-0 bottom-0", align: "left" },
  plan: { mid: 45, elbow: [346, 408], end: [396, 408], corner: "right-0 bottom-0", align: "right" },
};

const pt = (deg: number, r = R): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};

function arc(from: number, to: number, r = R): string {
  const [x1, y1] = pt(from, r);
  const [x2, y2] = pt(to, r);
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/**
 * Home-screen HUD: Iris's core ring with four gauge arcs around it, each wired
 * by a callout line to a corner readout you can tap to open that module.
 */
export function HudCore({ gauges, core, onOpen }: { gauges: Gauge[]; core: ReactNode; onOpen: (id: GaugeId) => void }) {
  return (
    <div className="relative mx-auto aspect-[400/460] w-full max-w-[400px] select-none">
      <svg viewBox="0 0 400 460" className="absolute inset-0 h-full w-full overflow-visible" fill="none" aria-hidden>
        <circle cx={CX} cy={CY} r={R + 14} stroke="currentColor" className="text-cyan-400/25" strokeDasharray="2 7" />
        <circle cx={CX} cy={CY} r={R - 12} stroke="currentColor" className="text-cyan-400/15" />
        {gauges.map((g) => {
          const L = LAYOUT[g.id];
          const color = g.alert ? AMBER : "currentColor";
          const start = L.mid - SPAN;
          const end = start + 2 * SPAN * Math.max(0.04, g.fill);
          const [ax, ay] = pt(L.mid, R + 10);
          return (
            <g key={g.id} className="text-cyan-300 hud-gauge" style={{ color: g.alert ? AMBER : undefined }}>
              {/* track, fill, then the callout line out to the corner */}
              <path d={arc(L.mid - SPAN, L.mid + SPAN)} stroke={color} strokeOpacity={0.18} strokeWidth={8} strokeLinecap="butt" />
              <path d={arc(start, end)} stroke={color} strokeWidth={8} strokeLinecap="butt" className="hud-gauge-fill" />
              <polyline
                points={`${ax.toFixed(1)},${ay.toFixed(1)} ${L.elbow[0]},${L.elbow[1]} ${L.end[0]},${L.end[1]}`}
                stroke={color}
                strokeOpacity={g.alert ? 0.95 : 0.7}
                strokeWidth={1.25}
                className="hud-callout"
              />
              <circle cx={ax} cy={ay} r={2.5} fill={color} />
            </g>
          );
        })}
      </svg>

      {/* Iris's ring sits in the middle (tap to talk). */}
      <div className="absolute left-1/2 top-1/2 w-[79%] -translate-x-1/2 -translate-y-1/2">{core}</div>

      {/* Corner readouts: tap to open the module. */}
      {gauges.map((g) => {
        const L = LAYOUT[g.id];
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onOpen(g.id)}
            aria-label={`${g.label}. Open ${g.id}`}
            className={`absolute ${L.corner} flex min-h-[48px] max-w-[48%] flex-col justify-center px-1 font-mono ${L.align === "right" ? "items-end text-right" : "items-start text-left"} ${
              g.id === "vitals" || g.id === "plan" ? "pt-1" : "pb-1"
            }`}
            style={{ height: "10.5%" }}
          >
            <span className={`truncate text-[15px] leading-tight tracking-wider ${g.alert ? "text-amber-300" : "text-cyan-50"}`}>{g.value}</span>
            <span className={`truncate text-[10px] tracking-[0.18em] ${g.alert ? "text-amber-300/90" : "text-cyan-300/80"}`}>{g.caption}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Module-open state: the core shrinks to the top with one callout to the module's readout. */
export function HudCoreCompact({ core, readout, alert }: { core: ReactNode; readout: string; alert?: boolean }) {
  const color = alert ? AMBER : "currentColor";
  return (
    <div className="relative mx-auto h-[136px] w-full max-w-[400px]">
      <div className="absolute left-1/2 top-0 w-[132px] -translate-x-1/2">{core}</div>
      <svg viewBox="0 0 400 136" className="absolute inset-0 h-full w-full text-cyan-300" fill="none" aria-hidden>
        <polyline points="248,92 282,124 396,124" stroke={color} strokeWidth={1.25} strokeOpacity={0.85} />
        <circle cx={248} cy={92} r={2.5} fill={color} />
      </svg>
      <p className={`absolute bottom-[18px] right-0 font-mono text-[11px] tracking-[0.18em] ${alert ? "text-amber-300" : "text-cyan-200"}`}>{readout}</p>
    </div>
  );
}
