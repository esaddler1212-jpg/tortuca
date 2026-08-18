import { useState } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { CalendarEvent } from "../types";

interface Props {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  onAddLocal: (title: string, start: string, end?: string) => void;
  onRemoveLocal: (id: string) => void;
}

export function SchedulePanel({
  events,
  loading,
  error,
  onAddLocal,
  onRemoveLocal,
}: Props) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !start) return;
    onAddLocal(title, start, end || undefined);
    setTitle("");
    setStart("");
    setEnd("");
  };

  return (
    <section className="panel p-5">
      <header className="mb-4 flex items-center gap-2 text-alfred-gold">
        <Calendar className="h-5 w-5" aria-hidden />
        <h2 className="font-display text-xl font-semibold tracking-wide">Schedule</h2>
      </header>
      {error && <p className="text-sm text-red-300/90 mb-2">{error}</p>}
      <form onSubmit={submit} className="space-y-2 mb-4 border-b border-alfred-border pb-4">
        <input
          className="input-field"
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="datetime-local"
            className="input-field"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            aria-label="Start"
          />
          <input
            type="datetime-local"
            className="input-field"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-label="End"
          />
        </div>
        <button type="submit" className="btn-gold w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Add local event
        </button>
      </form>
      {loading && <p className="text-sm text-alfred-mist animate-pulse">Loading calendar…</p>}
      <ul className="space-y-2 max-h-72 overflow-y-auto">
        {events.length === 0 && !loading && (
          <li className="text-sm text-alfred-mist">No upcoming events.</li>
        )}
        {events.map((ev) => (
          <li
            key={`${ev.source}-${ev.id}`}
            className="flex gap-3 rounded-lg border border-alfred-border/60 px-3 py-2 bg-alfred-ink/30"
          >
            <div className="text-xs text-alfred-gold w-20 shrink-0 pt-0.5">
              {format(parseISO(ev.start), "MMM d")}
              <br />
              {format(parseISO(ev.start), "h:mm a")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{ev.title}</p>
              <p className="text-xs text-alfred-mist capitalize">{ev.source}</p>
            </div>
            {ev.source === "local" && (
              <button
                type="button"
                className="btn-ghost p-1"
                onClick={() => onRemoveLocal(ev.id)}
                aria-label="Remove event"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
