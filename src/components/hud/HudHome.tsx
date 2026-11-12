import { Check, ChevronRight } from "lucide-react";
import type { TodoItem } from "../../types";

/** One amber line under the core: what matters right now. */
export function UrgentLine({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <p className="flex items-start justify-center gap-2 px-2 text-center font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-amber-300" role="status">
      <span aria-hidden>▲</span>
      <span>{items.join(" · ")}</span>
    </p>
  );
}

/** Glass sheet with the next few to-dos and today's spark. */
export function UpNextPanel({
  todos,
  onToggle,
  spark,
  sparkDone,
  onOpenToday,
}: {
  todos: TodoItem[];
  onToggle: (id: string) => void;
  spark?: { theme: string; prompt: string };
  sparkDone: boolean;
  onOpenToday: () => void;
}) {
  const next = todos.slice(0, 3);
  return (
    <section className="hud-glass relative p-4" aria-label="Up next">
      <span className="hud-glass-corner left-0 top-0 border-l-2 border-t-2" aria-hidden />
      <span className="hud-glass-corner right-0 top-0 border-r-2 border-t-2" aria-hidden />
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-300/80">Up next</p>
        {spark && (
          <p className={`font-mono text-[10px] uppercase tracking-[0.18em] ${sparkDone ? "text-emerald-300" : "text-amber-300"}`}>
            Spark {sparkDone ? "✓" : "◆"} {spark.theme}
          </p>
        )}
      </div>
      {next.length ? (
        <ul className="mt-2">
          {next.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onToggle(t.id)}
                className="flex min-h-[44px] w-full items-center gap-3 text-left text-[15px] text-cyan-50 group"
                aria-label={`Done: ${t.title}`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-cyan-300/60 group-active:border-cyan-200 group-active:bg-cyan-400/15">
                  <Check className="h-3.5 w-3.5 text-cyan-100 opacity-0 group-active:opacity-100" aria-hidden />
                </span>
                <span className="min-w-0 truncate">{t.title}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 py-2 text-sm text-cyan-100/80">Nothing on the list. Tell Iris what's next.</p>
      )}
      {spark && !sparkDone && <p className="mt-1 line-clamp-2 text-xs text-cyan-200/70">{spark.prompt}</p>}
      <button type="button" onClick={onOpenToday} className="mt-1 flex min-h-[44px] items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-300">
        Open today {todos.length > 3 ? `(+${todos.length - 3})` : ""} <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      </button>
    </section>
  );
}
