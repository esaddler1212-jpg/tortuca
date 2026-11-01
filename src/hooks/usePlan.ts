import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY_PLAN, type MwfsHabit, type PlanState } from "../../shared/plan";
import type { PlanTask, YearGoal } from "../../shared/planData";
import { fetchUserData, saveUserDataRemote } from "../lib/userData";
import { loadJson, saveJson } from "../lib/storage";

const PLAN_KEY = "alfred-plan-v1";
const OLD_GOALS_KEY = "alfred-goals-2026";

function initialPlan(): PlanState {
  const saved = loadJson<PlanState | null>(PLAN_KEY, null);
  if (saved) return { ...EMPTY_PLAN, ...saved };
  // First run: carry over MWFS check-ins from the old 2026 goals panel.
  const old = loadJson<{ mwfsLog?: PlanState["mwfsLog"] } | null>(OLD_GOALS_KEY, null);
  return { ...EMPTY_PLAN, mwfsLog: old?.mwfsLog ?? {} };
}

/**
 * Plan progress (tasks done, edited goals, MWFS), saved on the device and
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
        if (remote && remote.updatedAt > plan.updatedAt) setPlan({ ...EMPTY_PLAN, ...remote });
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

  const toggleMwfs = useCallback(
    (day: string, habit: MwfsHabit) =>
      update((p) => {
        const log = p.mwfsLog[day] ?? {};
        return { ...p, mwfsLog: { ...p.mwfsLog, [day]: { ...log, [habit]: !log[habit] } } };
      }),
    [update],
  );

  return { plan, toggleTask, addTask, removeTask, setGoals, toggleMwfs };
}
