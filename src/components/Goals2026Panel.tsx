import { Check, MapPin, Quote, Sparkles, Target } from "lucide-react";
import type { UserSettings } from "../types";
import { isMealPrepDay } from "../lib/mealPrep";
import {
  GOALS_YEAR,
  MWFS_HABITS,
  MWFS_LABELS,
  TRAVEL_TARGETS,
  YEAR_MOTTO,
  YEAR_MOTTO_NOTE,
  YEAR_QUOTE,
  dayKey,
  isMwfsDay,
  tripsCompleted,
  type Goals2026Progress,
  type MwfsHabit,
} from "../lib/goals2026";

interface Props {
  settings: UserSettings;
  progress: Goals2026Progress;
  onToggleTrip: (id: string) => void;
  onToggleMwfs: (dateKey: string, habit: MwfsHabit) => void;
  onToggleAiAgents: () => void;
}

const GYM_SCHEDULE = [
  { day: "Tue", label: "Arms & chest" },
  { day: "Thu", label: "Legs" },
  { day: "Sun", label: "Cardio + meal prep reset" },
];

export function Goals2026Panel({
  settings,
  progress,
  onToggleTrip,
  onToggleMwfs,
  onToggleAiAgents,
}: Props) {
  const tz = settings.timezone;
  const today = dayKey(tz);
  const mwfsToday = isMwfsDay(tz);
  const mealPrepToday = isMealPrepDay(settings);
  const trips = tripsCompleted(progress);

  return (
    <section className="panel-hud p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <p className="hud-label flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" /> {GOALS_YEAR} operator targets
          </p>
          <h2 className="font-display text-xl font-semibold tracking-wide text-alfred-cream mt-1">
            {YEAR_MOTTO}
          </h2>
          <p className="text-xs text-alfred-mist font-mono mt-0.5">{YEAR_MOTTO_NOTE}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-2xl text-alfred-gold hud-glow-text">{trips}/2</p>
          <p className="text-xs text-alfred-mist uppercase tracking-wider">solo trips</p>
        </div>
      </div>

      <blockquote className="border-l-2 border-green-400/50 pl-4 mb-4">
        <p className="text-sm text-alfred-cream/90 italic flex gap-2">
          <Quote className="h-4 w-4 text-alfred-gold/70 shrink-0 mt-0.5" aria-hidden />
          <span>&ldquo;{YEAR_QUOTE.text}&rdquo;</span>
        </p>
        <footer className="text-xs text-alfred-mist mt-1 pl-6">— {YEAR_QUOTE.author}</footer>
      </blockquote>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-alfred-border/50 bg-black/40 p-4">
          <p className="hud-label mb-3 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Solo trips
          </p>
          <ul className="space-y-2">
            {TRAVEL_TARGETS.map((t) => (
              <li key={t.id}>
                <label className="flex items-center gap-3 text-sm cursor-pointer group">
                  <button
                    type="button"
                    className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      progress.trips[t.id]
                        ? "border-alfred-gold bg-alfred-gold/20 text-alfred-gold"
                        : "border-alfred-border group-hover:border-alfred-gold/50"
                    }`}
                    onClick={() => onToggleTrip(t.id)}
                    aria-label={`Mark ${t.label} complete`}
                  >
                    {progress.trips[t.id] && <Check className="h-3 w-3" />}
                  </button>
                  <span className={progress.trips[t.id] ? "text-alfred-mist line-through" : "text-alfred-cream"}>
                    {t.label}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-alfred-border/50 bg-black/40 p-4">
          <p className="hud-label mb-3">Gym schedule</p>
          <ul className="space-y-2 text-sm">
            {GYM_SCHEDULE.map((row) => (
              <li key={row.day} className="flex justify-between gap-2 text-alfred-mist">
                <span className="font-mono text-alfred-gold w-10">{row.day}</span>
                <span className="text-alfred-cream flex-1 text-right">{row.label}</span>
              </li>
            ))}
          </ul>
          {mealPrepToday && (
            <p className="text-xs text-alfred-gold mt-3 border-t border-alfred-border/40 pt-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Sunday meal prep reset — check the panel below
            </p>
          )}
        </div>

        <div className="rounded-lg border border-alfred-border/50 bg-black/40 p-4">
          <label className="flex items-center gap-3 text-sm cursor-pointer group">
            <button
              type="button"
              className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                progress.aiAgents
                  ? "border-alfred-gold bg-alfred-gold/20 text-alfred-gold"
                  : "border-alfred-border group-hover:border-alfred-gold/50"
              }`}
              onClick={onToggleAiAgents}
              aria-label="Toggle AI Agents goal"
            >
              {progress.aiAgents && <Check className="h-3 w-3" />}
            </button>
            <span className={progress.aiAgents ? "text-alfred-cream" : "text-alfred-mist"}>
              AI Agents <span className="text-xs text-alfred-gold">(you&apos;re building Alfred ✓)</span>
            </span>
          </label>
        </div>

        <div className="rounded-lg border border-alfred-border/50 bg-black/40 p-4">
          <p className="hud-label mb-3">MWFS — Music · Meditate · Master</p>
          {mwfsToday ? (
            <div className="flex flex-wrap gap-2">
              {MWFS_HABITS.map((habit) => {
                const done = progress.mwfsLog[today]?.[habit];
                return (
                  <button
                    key={habit}
                    type="button"
                    className={`rounded-md border px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                      done
                        ? "border-alfred-gold bg-alfred-gold/15 text-alfred-gold"
                        : "border-alfred-border/60 text-alfred-mist hover:border-alfred-gold/40"
                    }`}
                    onClick={() => onToggleMwfs(today, habit)}
                  >
                    {done ? "✓ " : ""}
                    {MWFS_LABELS[habit]}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-alfred-mist">Mon · Wed · Fri · Sat — check in on habit days</p>
          )}
        </div>
      </div>
    </section>
  );
}
