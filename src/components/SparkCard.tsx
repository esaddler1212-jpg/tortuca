import { useState } from "react";
import { Check, Lightbulb, Shuffle, StickyNote } from "lucide-react";
import { THEME_LABEL } from "../../shared/sparks";
import { sparkDone, sparkStreak, sparkWeek, todaySpark, type PlanState } from "../../shared/plan";
import { promptForSpark } from "../lib/promptGenerator";
import { PromptButton } from "./PromptButton";

interface Props {
  plan: PlanState;
  today: string;
  onToggle: (day: string) => void;
  onShuffle: (day: string) => void;
  onNote: (day: string, note: string) => void;
  onOpenWorkshops?: () => void;
}

/** Today's creative spark: a mindset to carry and one small thing to make. */
export function SparkCard({ plan, today, onToggle, onShuffle, onNote, onOpenWorkshops }: Props) {
  const spark = todaySpark(plan, today);
  const done = sparkDone(plan, today);
  const streak = sparkStreak(plan, today);
  const week = sparkWeek(plan, today);
  const savedNote = plan.sparkLog[today]?.note ?? "";
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(savedNote);

  return (
    <section className="panel-hud p-4" aria-label="Daily creative spark">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <p className="hud-label flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5" aria-hidden /> Spark · {THEME_LABEL[spark.theme]}
        </p>
        <span className="font-mono text-[11px] text-alfred-mist shrink-0">
          {week.done}/7 this week{streak > 1 ? ` · ${streak}-day streak` : ""}
        </span>
      </div>
      <p className="text-base leading-snug text-alfred-gold">{spark.mindset}</p>
      <p className={`mt-2 text-sm leading-relaxed ${done ? "text-alfred-mist line-through" : ""}`}>{spark.prompt}</p>
      {savedNote && !noteOpen && <p className="mt-2 text-xs text-alfred-mist italic">“{savedNote}”</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`inline-flex min-h-[40px] items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-mono uppercase tracking-wider ${done ? "border-alfred-gold bg-alfred-gold/15 text-alfred-gold" : "border-alfred-border/60 text-alfred-mist hover:text-alfred-gold"}`}
          onClick={() => onToggle(today)}
          aria-pressed={done}
        >
          <Check className="h-3.5 w-3.5" aria-hidden /> {done ? "Sparked" : "Did it"}
        </button>
        {!done && (
          <button
            type="button"
            className="inline-flex min-h-[40px] items-center gap-1 rounded-md border border-alfred-border/60 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-alfred-mist hover:text-alfred-gold"
            onClick={() => onShuffle(today)}
          >
            <Shuffle className="h-3.5 w-3.5" aria-hidden /> Another one
          </button>
        )}
        <button
          type="button"
          className="inline-flex min-h-[40px] items-center gap-1 rounded-md border border-alfred-border/60 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-alfred-mist hover:text-alfred-gold"
          onClick={() => {
            setNote(savedNote);
            setNoteOpen((o) => !o);
          }}
        >
          <StickyNote className="h-3.5 w-3.5" aria-hidden /> Note
        </button>
        <PromptButton label="Riff" build={() => promptForSpark(spark, THEME_LABEL[spark.theme])} />
        {onOpenWorkshops ? (
          <button
            type="button"
            className="inline-flex min-h-[40px] items-center gap-1 rounded-md border border-alfred-border/60 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-alfred-mist hover:text-alfred-gold"
            onClick={onOpenWorkshops}
          >
            Workshops
          </button>
        ) : null}
      </div>

      {noteOpen && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onNote(today, note.trim());
            setNoteOpen(false);
          }}
        >
          <input
            className="input-field flex-1"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What came out of it? A line, an idea…"
            aria-label="Spark note"
            autoFocus
          />
          <button type="submit" className="btn-gold">Save</button>
        </form>
      )}
    </section>
  );
}
