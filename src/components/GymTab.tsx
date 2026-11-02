import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Check, ChevronDown, ChevronUp, Dumbbell, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { DEFAULT_ROUTINE, lastWeight, type Exercise, type GymDay, type HubState } from "../../shared/hub";
import {
  EQUIPMENT_GROUPS,
  displayName,
  equipmentGroup,
  isWeighted,
  searchExercises,
  swapCandidates,
  type EquipmentGroup,
  type LibExercise,
} from "../../shared/exercises";
import { addDays, weekdayOfDay } from "../../shared/timezone";

// Loaded once per visit, only when the Gym tab opens (~95 KB compressed).
let libCache: Promise<LibExercise[]> | null = null;
function loadLibrary(): Promise<LibExercise[]> {
  libCache ??= fetch("/exercises.json")
    .then((r) => (r.ok ? (r.json() as Promise<LibExercise[]>) : Promise.reject(new Error("load failed"))))
    .catch((e) => {
      libCache = null;
      throw e;
    });
  return libCache;
}

function useLibrary(): { lib: LibExercise[] | null; failed: boolean } {
  const [lib, setLib] = useState<LibExercise[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    loadLibrary().then(
      (l) => alive && setLib(l),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, []);
  return { lib, failed };
}

const chip = "rounded-full border px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider";

interface Props {
  hub: HubState;
  update: (fn: (h: HubState) => HubState) => void;
  today: string;
  onLogWorkout: (type: "arms" | "legs" | "body" | "cardio") => void;
  workoutLoggedToday: boolean;
}

/** Next date (from today) that falls on this weekday. */
function nextDateFor(weekday: string, today: string): string {
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, i);
    if (weekdayOfDay(d) === weekday) return d;
  }
  return today;
}

export function GymTab({ hub, update, today, onLogWorkout, workoutLoggedToday }: Props) {
  const routine = hub.routine ?? DEFAULT_ROUTINE;
  const { lib, failed } = useLibrary();
  const byId = useMemo(() => new Map((lib ?? []).map((x) => [x.id, x])), [lib]);

  // Default to today if it's a gym day, else the next one.
  const nextDay = useMemo(() => {
    for (let i = 0; i < 7; i++) {
      const wd = weekdayOfDay(addDays(today, i));
      if (routine.some((r) => r.weekday === wd)) return wd;
    }
    return routine[0]?.weekday;
  }, [routine, today]);
  const [weekday, setWeekday] = useState<string | undefined>(nextDay);
  const plan = routine.find((r) => r.weekday === weekday) ?? routine.find((r) => r.weekday === nextDay);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<Set<EquipmentGroup> | null>(null);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");

  if (!plan) return <p className="text-sm text-alfred-mist">No gym days set.</p>;
  const day = nextDateFor(plan.weekday, today);
  const isToday = day === today;
  const log = hub.gymLog[day] ?? {};
  const doneCount = plan.exercises.filter((e) => log[e.id]?.done).length;

  /** The library entry for a routine exercise (by link, else best name match). */
  const libFor = (ex: Exercise): LibExercise | undefined =>
    (ex.libId ? byId.get(ex.libId) : undefined) ?? (lib ? searchExercises(lib, ex.name, 1)[0] : undefined);

  const setPlan = (next: GymDay) =>
    update((h) => ({ ...h, routine: (h.routine ?? DEFAULT_ROUTINE).map((r) => (r.weekday === next.weekday ? next : r)) }));

  const fromLib = (x: LibExercise, keep?: Exercise): Exercise => {
    const cardio = x.t === "cardiovascular system";
    return {
      id: `lib-${x.id}`,
      name: displayName(x.n),
      sets: keep?.sets ?? (cardio ? 1 : 3),
      reps: keep?.reps ?? (cardio ? "20 min" : "10"),
      weighted: isWeighted(x),
      libId: x.id,
    };
  };

  const setEntry = (id: string, patch: { done?: boolean; weight?: number }) =>
    update((h) => {
      const dayLog = { ...(h.gymLog[day] ?? {}), [id]: { ...(h.gymLog[day]?.[id] ?? {}), ...patch } };
      const finished = plan.exercises.every((e) => dayLog[e.id]?.done);
      if (finished && isToday && !workoutLoggedToday) setTimeout(() => onLogWorkout(plan.workout), 0);
      return { ...h, gymLog: { ...h.gymLog, [day]: dayLog } };
    });

  const label = (wd: string) => {
    const d = nextDateFor(wd, today);
    return d === today ? "Today" : wd;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="hud-label flex items-center gap-1.5">
          <Dumbbell className="h-3.5 w-3.5" aria-hidden /> {label(plan.weekday)} · {plan.title}
        </p>
        <span className="font-mono text-xs text-alfred-mist">
          {doneCount}/{plan.exercises.length}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {routine.map((r) => (
          <button
            key={r.weekday}
            type="button"
            className={`${chip} ${r.weekday === plan.weekday ? "border-alfred-gold bg-alfred-gold/15 text-alfred-gold" : "border-alfred-border/60 text-alfred-mist"}`}
            onClick={() => {
              setWeekday(r.weekday);
              setExpanded(null);
              setSwapFor(null);
            }}
          >
            {label(r.weekday)}
          </button>
        ))}
        <button
          type="button"
          className={`${chip} ml-auto inline-flex items-center gap-1 ${editing ? "border-alfred-gold text-alfred-gold" : "border-alfred-border/60 text-alfred-mist"}`}
          onClick={() => setEditing((e) => !e)}
          aria-pressed={editing}
        >
          <Pencil className="h-3 w-3" aria-hidden /> {editing ? "Done" : "Edit day"}
        </button>
      </div>
      {!isToday && !editing && <p className="text-xs text-alfred-mist">Rest day. Here's what's coming. Tap an exercise for how-to.</p>}

      <ul className="space-y-2">
        {plan.exercises.map((ex) => {
          const entry = log[ex.id] ?? {};
          const prev = lastWeight(hub.gymLog, ex.id, day);
          const info = libFor(ex);
          const open = expanded === ex.id;
          return (
            <li key={ex.id} className={`rounded-lg border px-3 py-2 text-sm ${entry.done ? "border-alfred-border/30 opacity-60" : "border-alfred-border/60"}`}>
              <div className="flex items-center gap-3">
                {isToday && !editing && (
                  <button
                    type="button"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${entry.done ? "border-alfred-gold/60 bg-alfred-gold/20 text-alfred-gold" : "border-alfred-border hover:border-alfred-gold"}`}
                    onClick={() => setEntry(ex.id, { done: !entry.done })}
                    aria-label={entry.done ? `Undo ${ex.name}` : `Done: ${ex.name}`}
                  >
                    {entry.done && <Check className="h-4 w-4" />}
                  </button>
                )}
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setExpanded(open ? null : ex.id)} aria-expanded={open}>
                  <p className={`flex items-center gap-1 ${entry.done ? "line-through" : ""}`}>
                    <span className="truncate">{ex.name}</span>
                    {open ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-alfred-mist" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-alfred-mist" />}
                  </p>
                  {!editing && (
                    <p className="text-[11px] text-alfred-mist">
                      {ex.sets} × {ex.reps}
                      {info ? ` · ${info.t}` : ""}
                      {prev !== undefined ? ` · last ${prev} lb` : ""}
                    </p>
                  )}
                </button>
                {editing ? (
                  <span className="flex items-center gap-1">
                    <input
                      className="w-10 rounded border border-alfred-border/60 bg-transparent px-1 py-1 text-center text-xs"
                      type="number"
                      min={1}
                      value={ex.sets}
                      onChange={(e) => setPlan({ ...plan, exercises: plan.exercises.map((x) => (x.id === ex.id ? { ...x, sets: Math.max(1, Number(e.target.value) || 1) } : x)) })}
                      aria-label={`${ex.name} sets`}
                    />
                    <span className="text-xs text-alfred-mist">×</span>
                    <input
                      className="w-16 rounded border border-alfred-border/60 bg-transparent px-1 py-1 text-center text-xs"
                      value={ex.reps}
                      onChange={(e) => setPlan({ ...plan, exercises: plan.exercises.map((x) => (x.id === ex.id ? { ...x, reps: e.target.value } : x)) })}
                      aria-label={`${ex.name} reps`}
                    />
                    <button type="button" className="btn-ghost p-1" onClick={() => setPlan({ ...plan, exercises: plan.exercises.filter((x) => x.id !== ex.id) })} aria-label={`Remove ${ex.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ) : (
                  ex.weighted &&
                  isToday && (
                    <input
                      className="w-16 rounded border border-alfred-border/60 bg-transparent px-1.5 py-1 text-right text-xs"
                      type="number"
                      inputMode="decimal"
                      placeholder={prev !== undefined ? String(prev) : "lb"}
                      value={entry.weight ?? ""}
                      onChange={(e) => setEntry(ex.id, { weight: e.target.value === "" ? undefined : Number(e.target.value) })}
                      aria-label={`${ex.name} weight (lb)`}
                    />
                  )
                )}
              </div>

              {open && (
                <div className="mt-2 space-y-2 border-t border-alfred-border/40 pt-2">
                  {!info && !failed && <p className="text-xs text-alfred-mist">Loading how-to…</p>}
                  {failed && <p className="text-xs text-amber-300/90">Couldn't load the exercise library.</p>}
                  {info && (
                    <>
                      <p className="text-[11px] text-alfred-mist">
                        Works <span className="text-alfred-gold">{info.t}</span>
                        {info.m2.length ? ` · also ${info.m2.join(", ")}` : ""} · {info.eq}
                      </p>
                      <ol className="list-decimal space-y-1 pl-4 text-xs leading-relaxed">
                        {info.s.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                      <button
                        type="button"
                        className={`${chip} inline-flex items-center gap-1 border-alfred-border/60 text-alfred-mist hover:text-alfred-gold`}
                        onClick={() => setSwapFor(swapFor === ex.id ? null : ex.id)}
                      >
                        <ArrowLeftRight className="h-3 w-3" aria-hidden /> Swap
                      </button>
                    </>
                  )}
                  {info && lib && swapFor === ex.id && (
                    <div className="space-y-2 rounded-md border border-alfred-border/40 p-2">
                      <p className="text-[11px] text-alfred-mist">Same muscle ({info.t}). What do you have?</p>
                      <div className="flex flex-wrap gap-1">
                        {EQUIPMENT_GROUPS.map((g) => {
                          const on = !allowed || allowed.has(g);
                          return (
                            <button
                              key={g}
                              type="button"
                              className={`${chip} ${allowed && on ? "border-alfred-gold bg-alfred-gold/15 text-alfred-gold" : "border-alfred-border/60 text-alfred-mist"}`}
                              onClick={() => {
                                const next = new Set(allowed ?? []);
                                if (allowed && next.has(g)) next.delete(g);
                                else next.add(g);
                                setAllowed(next.size ? next : null);
                              }}
                              aria-pressed={Boolean(allowed && on)}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>
                      <ul className="space-y-1">
                        {swapCandidates(lib, info, allowed).map((x) => (
                          <li key={x.id}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs hover:bg-alfred-gold/10"
                              aria-label={`Swap to ${displayName(x.n)}`}
                              onClick={() => {
                                setPlan({ ...plan, exercises: plan.exercises.map((e) => (e.id === ex.id ? fromLib(x, ex) : e)) });
                                setSwapFor(null);
                                setExpanded(null);
                              }}
                            >
                              <span>{displayName(x.n)}</span>
                              <span className="shrink-0 text-[10px] text-alfred-mist">{equipmentGroup(x.eq)}</span>
                            </button>
                          </li>
                        ))}
                        {!swapCandidates(lib, info, allowed).length && <li className="text-xs text-alfred-mist">Nothing for that equipment. Try another.</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {editing && (
        <div className="space-y-2 border-t border-alfred-border/40 pt-3">
          <label className="flex items-center gap-2 rounded-md border border-alfred-border/60 px-2">
            <Search className="h-4 w-4 text-alfred-mist" aria-hidden />
            <input
              className="w-full bg-transparent py-2 text-sm outline-none"
              placeholder="Add an exercise: e.g. 'dumbbell shoulder', 'hamstrings'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search exercises"
            />
          </label>
          {lib && query.trim() && (
            <ul className="space-y-1">
              {searchExercises(lib, query, 8).map((x) => (
                <li key={x.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs hover:bg-alfred-gold/10"
                    aria-label={`Add ${displayName(x.n)}`}
                    onClick={() => {
                      const add = fromLib(x);
                      if (!plan.exercises.some((e) => e.id === add.id)) setPlan({ ...plan, exercises: [...plan.exercises, add] });
                      setQuery("");
                    }}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Plus className="h-3 w-3" aria-hidden /> {displayName(x.n)}
                    </span>
                    <span className="shrink-0 text-[10px] text-alfred-mist">
                      {x.t} · {equipmentGroup(x.eq)}
                    </span>
                  </button>
                </li>
              ))}
              {!searchExercises(lib, query, 1).length && <li className="text-xs text-alfred-mist">No matches.</li>}
            </ul>
          )}
          <label className="flex items-center gap-2 text-xs text-alfred-mist">
            Day name
            <input
              className="flex-1 rounded border border-alfred-border/60 bg-transparent px-2 py-1 text-sm text-alfred-cream"
              value={plan.title}
              onChange={(e) => setPlan({ ...plan, title: e.target.value })}
              aria-label="Day name"
            />
          </label>
          {hub.routine && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] text-alfred-mist underline"
              onClick={() => update((h) => ({ ...h, routine: null }))}
            >
              <RotateCcw className="h-3 w-3" aria-hidden /> Reset all days to the starter routine
            </button>
          )}
        </div>
      )}

      {isToday && !editing && plan.exercises.length > 0 && doneCount === plan.exercises.length && (
        <p className="text-sm text-emerald-400/90">✓ Workout done and logged.</p>
      )}
      <p className="text-[10px] text-alfred-mist">
        Exercise how-tos from the open exercises-dataset (MIT).{" "}
        <a href="/exercises.LICENSE.txt" target="_blank" rel="noreferrer" className="underline">
          License
        </a>
      </p>
    </div>
  );
}
