import { Dumbbell } from "lucide-react";
import type { UserSettings } from "../types";
import { WORKOUT_LABELS, buildFitnessStatus, type WorkoutType } from "../lib/fitness";
import type { CalendarEvent } from "../types";
import type { FitnessLog } from "../types";

interface Props {
  settings: UserSettings;
  logs: FitnessLog[];
  events: CalendarEvent[];
  onLog: (type: WorkoutType) => void;
}

const TYPES: WorkoutType[] = ["arms", "body", "legs", "cardio"];

export function FitnessPanel({ settings, logs, events, onLog }: Props) {
  const status = buildFitnessStatus(settings, logs, events);

  return (
    <section className="panel p-5 border-alfred-border/80">
      <h3 className="font-display text-lg text-alfred-gold mb-2 flex items-center gap-2">
        <Dumbbell className="h-4 w-4" /> Training
      </h3>
      {status.prompt && (
        <p className="text-sm text-alfred-cream/90 mb-3 italic border-l-2 border-alfred-gold/40 pl-3">
          {status.prompt}
        </p>
      )}
      {status.loggedToday ? (
        <p className="text-sm text-emerald-400/90 mb-3">
          ✓ {WORKOUT_LABELS[status.loggedToday.type]} logged ({status.loggedToday.slot})
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                type === status.suggestType
                  ? "border-alfred-gold/50 bg-alfred-gold/10 text-alfred-gold"
                  : "border-alfred-border/60 hover:border-alfred-gold/30"
              }`}
              onClick={() => onLog(type)}
            >
              {WORKOUT_LABELS[type]}
            </button>
          ))}
        </div>
      )}
      {!status.loggedToday && status.suggestLaterTime && (
        <p className="text-xs text-alfred-mist mb-3">
          Suggested: {WORKOUT_LABELS[status.suggestType]} around {status.suggestLaterTime}
        </p>
      )}
      <div className="border-t border-alfred-border/60 pt-3">
        <p className="text-xs uppercase tracking-wider text-alfred-mist mb-2">This week</p>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {TYPES.map((type) => (
            <div key={type} className="rounded bg-alfred-ink/40 py-2">
              <p className="text-alfred-gold font-medium">{status.weekCounts[type]}</p>
              <p className="text-alfred-mist capitalize">{type}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
