import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY_PLAN, type PlanState, type SparkEntry } from "../../shared/plan";
import { YEAR_GOALS, type PlanTask, type YearGoal } from "../../shared/planData";
import { fetchUserData, saveUserDataRemote } from "../lib/userData";
import { loadJson, saveJson } from "../lib/storage";

const PLAN_KEY = "alfred-plan-v1";
/** Fill in fields added later (older saves had MWFS check-ins, now retired). */
function normalize(p: Partial<PlanState> & { mwfsLog?: unknown }): PlanState {
  const { mwfsLog: _old, ...rest } = p;
  void _old;
  const goals = rest.goals?.map((g) =>
    g.id === "g26-mwfs" || g.id === "g27-mwfs"
      ? YEAR_GOALS.find((y) => y.id === g.id.replace("mwfs", "spark")) ?? g
      : g,
  ) ?? null;
  return { ...EMPTY_PLAN, ...rest, goals, sparkLog: rest.sparkLog ?? {} };
}

function initialPlan(): PlanState {
  const saved = loadJson<PlanState | null>(PLAN_KEY, null);
  return saved ? normalize(saved) : { ...EMPTY_PLAN };
}

/**
 * Plan progress (tasks done, edited goals, daily sparks), saved on the device and
 * synced to Alfred's server so phone and computer stay in step. The newest
 * copy wins.
 */
export function usePlan() {
  const [plan, setPlan] = useState<PlanState>(initialPlan);
  const loadedRemote = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull the synced copy once; keep whichever is newer.
  useEffect(() => {
    void (async () => {
      try {
        const remote = (await fetchUserData())?.plan as PlanState | undefined;
        if (remote && remote.updatedAt > plan.updatedAt) setPlan(normalize(remote));
      } catch {
        /* offline: local copy is fine */
      } finally {
        loadedRemote.current = true;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save locally right away; push to the server shortly after changes settle.
  useEffect(() => {
    saveJson(PLAN_KEY, plan);
    if (!loadedRemote.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void saveUserDataRemote({ plan: plan as never }).catch(() => undefined);
    }, 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [plan]);

  const update = useCallback((fn: (p: PlanState) => PlanState) => {
    setPlan((p) => ({ ...fn(p), updatedAt: new Date().toISOString() }));
  }, []);

  const toggleTask = useCallback(
    (id: string) =>
      update((p) => {
        const done = { ...p.done };
        if (done[id]) delete done[id];
        else done[id] = new Date().toISOString();
        return { ...p, done };
      }),
    [update],
  );

  const addTask = useCallback(
    (task: PlanTask) => update((p) => ({ ...p, customTasks: [...p.customTasks, task] })),
    [update],
  );

  const removeTask = useCallback(
    (id: string) =>
      update((p) => ({
        ...p,
        hidden: p.customTasks.some((t) => t.id === id) ? p.hidden : [...p.hidden, id],
        customTasks: p.customTasks.filter((t) => t.id !== id),
      })),
    [update],
  );

  const setGoals = useCallback((goals: YearGoal[]) => update((p) => ({ ...p, goals })), [update]);

  const patchSpark = useCallback(
    (day: string, fn: (e: SparkEntry) => SparkEntry) =>
      update((p) => ({ ...p, sparkLog: { ...p.sparkLog, [day]: fn(p.sparkLog[day] ?? {}) } })),
    [update],
  );

  const toggleSpark = useCallback(
    (day: string) => patchSpark(day, (e) => ({ ...e, done: e.done ? undefined : new Date().toISOString() })),
    [patchSpark],
  );
  const shuffleSpark = useCallback(
    (day: string) => patchSpark(day, (e) => ({ ...e, shuffle: (e.shuffle ?? 0) + 1 })),
    [patchSpark],
  );
  const noteSpark = useCallback(
    (day: string, note: string) => patchSpark(day, (e) => ({ ...e, note: note || undefined })),
    [patchSpark],
  );

  return { plan, toggleTask, addTask, removeTask, setGoals, toggleSpark, shuffleSpark, noteSpark };
}
