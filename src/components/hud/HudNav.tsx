import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import { HUD_MORE as MORE_IDS, HUD_TABS as TAB_IDS, HUD_MODULES, moduleLabel, type HudModuleId } from "../../../shared/hudModules";

const labelOf = (id: HudModuleId) => moduleLabel(id);

export interface TabBadge {
  count?: number;
  alert?: boolean;
}

/** Bottom HUD tab bar: always in thumb reach, above the iPhone home bar. */
export function HudTabBar({
  active,
  moreOpen,
  badges,
  onTab,
  onMore,
}: {
  active: HudModuleId | null;
  moreOpen: boolean;
  badges: Partial<Record<HudModuleId, TabBadge>>;
  onTab: (id: HudModuleId) => void;
  onMore: () => void;
}) {
  const moreActive = moreOpen || (active !== null && MORE_IDS.includes(active));
  const moreAlert = MORE_IDS.some((id) => badges[id]?.alert);
  const tab = (key: string, label: string, on: boolean, alert: boolean | undefined, count: number | undefined, onClick: () => void) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-current={on ? "page" : undefined}
      aria-label={`${label}${count ? `, ${count}` : ""}${alert ? ", needs attention" : ""}`}
      className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 border-t-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
        on ? (alert ? "border-amber-300 text-amber-200" : "border-cyan-300 text-cyan-50") : alert ? "border-amber-400/60 text-amber-300" : "border-cyan-900/80 text-cyan-300/70"
      }`}
    >
      <span>
        {label}
        {count ? <span className="ml-1">{count > 99 ? "99+" : count}</span> : null}
      </span>
    </button>
  );
  return (
    <nav
      className="hud-tabbar fixed inset-x-0 bottom-0 z-30 border-t border-cyan-400/15 bg-black/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Modules"
    >
      <div className="mx-auto flex max-w-[640px] gap-1 px-2">
        {TAB_IDS.map((id) => tab(id, labelOf(id), active === id && !moreOpen, badges[id]?.alert, badges[id]?.count, () => onTab(id)))}
        {tab("more", "More", moreActive, moreAlert, undefined, onMore)}
      </div>
    </nav>
  );
}

/** "More" sheet: the rest of the modules, as glass tiles above the tab bar. */
export function MoreSheet({
  open,
  badges,
  onPick,
  onClose,
}: {
  open: boolean;
  badges: Partial<Record<HudModuleId, TabBadge>>;
  onPick: (id: HudModuleId) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-20 bg-black/55" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal
        aria-label="More modules"
        className="hud-glass animate-hud-sheet absolute inset-x-3 mx-auto max-w-[560px] p-4"
        style={{ bottom: "calc(60px + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-200">More modules</p>
          <button type="button" className="flex h-11 w-11 items-center justify-center text-cyan-300" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MORE_IDS.map((id) => {
            const def = HUD_MODULES.find((p) => p.id === id);
            const b = badges[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPick(id)}
                className={`flex min-h-[64px] flex-col items-center justify-center rounded-md border px-1 font-mono text-[11px] uppercase tracking-[0.12em] ${
                  b?.alert ? "border-amber-400/60 text-amber-200" : "border-cyan-400/25 text-cyan-100"
                }`}
              >
                <span className="h-1.5 w-6 rounded-full" style={{ background: def?.color }} aria-hidden />
                <span className="mt-2">{def?.label ?? id}</span>
                {b?.count ? <span className="text-[10px] text-amber-300">{b.count}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** A module opened as a glass panel. Swipe down on its header (or tap ✕) to close. */
export function GlassModule({ id, onClose, children }: { id: HudModuleId; onClose: () => void; children: ReactNode }) {
  const label = labelOf(id);
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);
  const dragRef = useRef(0);
  return (
    <section
      className="hud-glass hud-glass-module animate-hud-sheet relative"
      aria-label={`${label} module`}
      style={drag ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined}
    >
      <span className="hud-glass-corner left-0 top-0 border-l-2 border-t-2" aria-hidden />
      <span className="hud-glass-corner right-0 top-0 border-r-2 border-t-2" aria-hidden />
      <header
        className="flex touch-none items-center justify-between gap-2 px-4 pb-2 pt-2"
        onTouchStart={(e) => {
          startY.current = e.touches[0].clientY;
          dragRef.current = 0;
        }}
        onTouchMove={(e) => {
          if (startY.current === null) return;
          dragRef.current = Math.max(0, e.touches[0].clientY - startY.current);
          setDrag(dragRef.current);
        }}
        onTouchEnd={() => {
          const pulled = dragRef.current;
          startY.current = null;
          dragRef.current = 0;
          setDrag(0);
          if (pulled > 70) onClose();
        }}
      >
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4 text-cyan-300/60" aria-hidden />
          <h2 className="font-mono text-[12px] uppercase tracking-[0.3em] text-cyan-50">{label}</h2>
        </div>
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center text-cyan-300" aria-label={`Close ${label}`}>
          <X className="h-5 w-5" />
        </button>
      </header>
      <div className="mx-auto h-1 w-10 -translate-y-1 rounded-full bg-cyan-300/30" aria-hidden />
      <div className="space-y-4 px-3 pb-4 pt-1 sm:px-4">{children}</div>
    </section>
  );
}
