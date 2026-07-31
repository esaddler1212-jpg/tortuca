import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Clock, Dumbbell, Moon, Quote, X } from "lucide-react";
import type { UserSettings } from "../types";
import type { LeaveByPlan } from "../lib/leaveBy";
import type { FitnessStatus } from "../lib/fitness";
import { WORKOUT_LABELS, type WorkoutType } from "../lib/fitness";
import { getDailyQuote } from "../lib/dailyQuote";
import { dayKey } from "../lib/leaveBy";

interface Props {
  settings: UserSettings;
  fitness: FitnessStatus;
  leaveBy: LeaveByPlan | null;
  onLogWorkout: (type: WorkoutType) => void;
}

const WORKOUTS: WorkoutType[] = ["arms", "body", "legs", "cardio"];

export function MorningRitualModal({ settings, fitness, leaveBy, onLogWorkout }: Props) {
  const [open, setOpen] = useState(false);
  const quote = getDailyQuote(settings.timezone);

  useEffect(() => {
    if (!fitness.needsMorningCheck) {
      setOpen(false);
      return;
    }
    const key = `alfred-morning-ritual-${dayKey(settings.timezone)}`;
    if (localStorage.getItem(key)) return;
    setOpen(true);
  }, [fitness.needsMorningCheck, settings.timezone]);

  const dismiss = () => {
    const key = `alfred-morning-ritual-${dayKey(settings.timezone)}`;
    localStorage.setItem(key, "1");
    setOpen(false);
  };

  const log = (type: WorkoutType) => {
    onLogWorkout(type);
    dismiss();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 p-4" role="dialog" aria-modal>
      <div className="panel w-full max-w-lg p-6 border-alfred-gold/30 shadow-panel">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-alfred-gold">Morning ritual</p>
            <h2 className="font-display text-2xl font-semibold mt-1">Rise and operate</h2>
          </div>
          <button type="button" className="btn-ghost p-2" onClick={dismiss} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <blockquote className="border-l-2 border-alfred-gold/40 pl-4 mb-4">
          <p className="text-sm text-alfred-cream/90 italic flex gap-2">
            <Quote className="h-4 w-4 text-alfred-gold/70 shrink-0 mt-0.5" aria-hidden />
            <span>&ldquo;{quote.text}&rdquo;</span>
          </p>
          <footer className="text-xs text-alfred-mist mt-1 pl-6">— {quote.author}</footer>
        </blockquote>

        {leaveBy && (
          <p className="text-sm text-alfred-mist mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-alfred-gold shrink-0" />
            Leave by {format(leaveBy.leaveBy, "h:mm a")} for {leaveBy.destination}
            {leaveBy.scheduleLabel ? ` · ${leaveBy.scheduleLabel}` : ""}
          </p>
        )}

        <p className="text-sm text-alfred-cream mb-3 flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-alfred-gold" />
          Did you train yet?
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {WORKOUTS.map((type) => (
            <button
              key={type}
              type="button"
              className="btn-gold text-sm py-2.5"
              onClick={() => log(type)}
            >
              {WORKOUT_LABELS[type]}
            </button>
          ))}
        </div>

        <button type="button" className="btn-ghost w-full text-sm text-alfred-mist" onClick={dismiss}>
          <Moon className="inline h-3.5 w-3.5 mr-1" />
          Skip for now — I&apos;ll train later
        </button>
      </div>
    </div>
  );
}
