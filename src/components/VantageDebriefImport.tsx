import { useRef, useState } from "react";
import { Check, FileUp, ListPlus, Trash2, Upload } from "lucide-react";
import type { HubState } from "../../shared/hub";
import { extractTodos } from "../../shared/hub";
import {
  normalizeVantageDebriefText,
  saveVantageDebrief,
  vantageDebriefForDay,
  spokenVantageDebrief,
  type VantageDebrief,
} from "../../shared/vantageDebrief";
import { useVoiceOutput } from "../hooks/useVoiceOutput";

type Update = (fn: (h: HubState) => HubState) => void;

export function VantageDebriefImport({
  hub,
  update,
  today,
  timeZone,
  onAddTodo,
  compact,
}: {
  hub: HubState;
  update: Update;
  today: string;
  timeZone: string;
  onAddTodo?: (title: string) => void;
  /** Smaller layout for Today HUD. */
  compact?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(!compact);
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const voice = useVoiceOutput();

  const saved = vantageDebriefForDay(hub.vantageDebrief, today);
  const preview = saved?.text ?? "";

  const persist = (text: string, source: VantageDebrief["source"]) => {
    const normalized = normalizeVantageDebriefText(text);
    if (!normalized) {
      setStatus("Paste or upload some text first.");
      return;
    }
    update((h) => ({ ...h, vantageDebrief: saveVantageDebrief(normalized, timeZone, source) }));
    setDraft("");
    setStatus("Saved as today's Vantage Point debrief. Iris can use it in chat and Brief me.");
    setOpen(false);
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setDraft(text);
      setOpen(true);
      setStatus(`Loaded ${file.name} (${Math.round(file.size / 1024)} KB). Review and save.`);
    };
    reader.onerror = () => setStatus("Could not read that file.");
    reader.readAsText(file);
  };

  const clearDebrief = () => {
    update((h) => ({ ...h, vantageDebrief: null }));
    setStatus("Cleared today's imported debrief.");
  };

  const pullTodos = () => {
    if (!saved?.text || !onAddTodo) return;
    const todos = extractTodos(saved.text);
    todos.forEach((t) => onAddTodo(t));
    setStatus(todos.length ? `Added ${todos.length} to-do${todos.length === 1 ? "" : "s"}.` : "No action lines found — try “remember to…” in the debrief.");
  };

  const spoken = saved ? spokenVantageDebrief(saved.text) : "";

  return (
    <section className={compact ? "space-y-2" : "space-y-3 rounded-lg border border-cyan-500/25 bg-cyan-950/20 px-3 py-3"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`font-mono uppercase tracking-[0.2em] text-cyan-400/70 ${compact ? "text-[9px]" : "text-[10px]"}`}>
          Claude Vantage Point debrief
        </p>
        {compact && (
          <button type="button" className="btn-ghost text-[11px] text-cyan-200/80" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide" : saved ? "Update debrief" : "Import debrief"}
          </button>
        )}
      </div>

      {saved && !open && (
        <div className="space-y-2">
          <p className={`text-cyan-50/90 whitespace-pre-wrap ${compact ? "max-h-32 overflow-y-auto text-xs" : "max-h-48 overflow-y-auto text-sm"}`}>
            {preview.length > 1200 && compact ? `${preview.slice(0, 1200)}…` : preview}
          </p>
          <div className="flex flex-wrap gap-2">
            {voice.supported && spoken && (
              <button type="button" className="btn-gold text-xs" onClick={() => (voice.speaking ? voice.stop() : voice.speak(spoken, { force: true }))}>
                {voice.speaking ? "Stop" : "Read debrief"}
              </button>
            )}
            {onAddTodo && (
              <button type="button" className="btn-ghost inline-flex items-center gap-1 border border-alfred-border/60 text-xs" onClick={pullTodos}>
                <ListPlus className="h-3.5 w-3.5" aria-hidden /> To-dos from debrief
              </button>
            )}
            <button type="button" className="btn-ghost text-xs text-alfred-mist" onClick={() => setOpen(true)}>
              Replace
            </button>
            <button type="button" className="btn-ghost p-1 text-alfred-mist" onClick={clearDebrief} aria-label="Clear debrief">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {open && (
        <>
          <p className="text-xs text-alfred-mist">
            Paste the daily debrief from Claude (Vantage Point) or drop a `.txt` / `.md` file. Saves for <span className="font-mono text-cyan-200/80">{today}</span> and syncs across devices.
          </p>
          <textarea
            className={`input-field w-full resize-y text-sm ${compact ? "min-h-[100px]" : "min-h-[140px]"}`}
            placeholder="Paste your Claude Vantage Point debrief here…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Vantage Point debrief"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-gold inline-flex items-center gap-1.5 text-xs" onClick={() => persist(draft, "paste")}>
              <Check className="h-3.5 w-3.5" aria-hidden /> Save for today
            </button>
            <button type="button" className="btn-ghost inline-flex items-center gap-1.5 border border-alfred-border/60 text-xs" onClick={() => fileRef.current?.click()}>
              <FileUp className="h-3.5 w-3.5" aria-hidden /> Upload file
            </button>
            <input ref={fileRef} type="file" accept=".txt,.md,text/plain,text/markdown" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            {saved && (
              <button type="button" className="btn-ghost text-xs" onClick={() => setOpen(false)}>
                Cancel
              </button>
            )}
          </div>
          {!compact && (
            <p className="flex items-center gap-1 text-[11px] text-alfred-mist/80">
              <Upload className="h-3 w-3" aria-hidden /> Tip: copy from Claude chat or export; no API key needed.
            </p>
          )}
        </>
      )}

      {status && <p className="text-xs text-alfred-gold">{status}</p>}
    </section>
  );
}
