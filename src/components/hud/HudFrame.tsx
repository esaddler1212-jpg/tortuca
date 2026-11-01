import type { ReactNode } from "react";

interface Props {
  /** Small all-caps title, e.g. "Vitals" → "SYSTEM // VITALS" */
  title: string;
  /** Muted tag in the top-right corner */
  tag?: string;
  className?: string;
  children: ReactNode;
}

/** Corner-bracket HUD panel used by the operator console. */
export function HudFrame({ title, tag, className = "", children }: Props) {
  return (
    <section className={`hud-frame p-4 ${className}`}>
      <header className="flex items-start justify-between gap-2 border-b border-cyan-400/10 pb-2 mb-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
          System <span className="text-cyan-400/50">//</span> <span className="text-alfred-cream">{title}</span>
        </h2>
        {tag && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/40 whitespace-nowrap">
            {tag}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

/** Labelled progress bar (0–100). */
export function HudBar({ label, value, pct }: { label: string; value: string; pct: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between font-mono text-xs mb-1">
        <span className="text-cyan-100/80">{label}</span>
        <span className="text-cyan-300">{value}</span>
      </div>
      <div className="hud-bar" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <span style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
