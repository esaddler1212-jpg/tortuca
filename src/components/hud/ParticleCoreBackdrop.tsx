import type { ParticleViz } from "../../lib/hudPrefs";

const LABEL: Record<Exclude<ParticleViz, "off">, string> = {
  orbits: "Orbits",
  cortex: "Cortex",
  strata: "Strata",
};

export function ParticleCoreBackdrop({
  viz,
  compact,
  onPick,
}: {
  viz: ParticleViz;
  compact?: boolean;
  onPick?: (v: ParticleViz) => void;
}) {
  if (viz === "off") return null;
  const skin =
    viz === "orbits"
      ? "particle-orbits"
      : viz === "cortex"
        ? "particle-cortex"
        : "particle-strata";
  const choices: ParticleViz[] = ["off", "orbits", "cortex", "strata"];
  return (
    <div className={`particle-core pointer-events-none absolute inset-0 overflow-hidden ${skin}`} aria-hidden>
      <div className="particle-dots absolute inset-0" />
      {!compact && onPick ? (
        <div className="pointer-events-auto absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5">
          {choices.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onPick(c)}
              className={`rounded-full border px-2 py-1 font-mono text-[8px] uppercase tracking-widest ${
                c === viz
                  ? "border-[rgb(var(--accent-400)/0.55)] text-[rgb(var(--accent-200))]"
                  : "border-white/15 text-slate-500 hover:text-slate-300"
              }`}
            >
              {c === "off" ? "Off" : LABEL[c]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
