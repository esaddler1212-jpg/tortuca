import { lazy } from "react";
import type { HudModuleId } from "../shared/hudModules";

export const LazyPlanPanel = lazy(() => import("./components/PlanPanel").then((m) => ({ default: m.PlanPanel })));
export const LazyTodayCommandCenter = lazy(() =>
  import("./components/TodayCommandCenter").then((m) => ({ default: m.TodayCommandCenter })),
);
export const LazyInboxPanel = lazy(() => import("./components/InboxPanel").then((m) => ({ default: m.InboxPanel })));
export const LazyHubPanel = lazy(() => import("./components/HubPanel").then((m) => ({ default: m.HubPanel })));
export const LazyMealPrepPanel = lazy(() => import("./components/MealPrepPanel").then((m) => ({ default: m.MealPrepPanel })));
export const LazyBusinessResearcherPanel = lazy(() =>
  import("./components/BusinessResearcherPanel").then((m) => ({ default: m.BusinessResearcherPanel })),
);
export const LazyChannelsPanel = lazy(() => import("./components/ChannelsPanel").then((m) => ({ default: m.ChannelsPanel })));

const PREFETCH: Partial<Record<HudModuleId, () => Promise<unknown>>> = {
  today: () => import("./components/TodayCommandCenter"),
  inbox: () => import("./components/InboxPanel"),
  plan: () => import("./components/PlanPanel"),
  hub: () => import("./components/HubPanel"),
  meal: () => import("./components/MealPrepPanel"),
  research: () => import("./components/BusinessResearcherPanel"),
  channels: () => import("./components/ChannelsPanel"),
};

/** Warm the chunk before the user opens a tab (reduces "Loading module…" flash). */
export function prefetchHudModule(id: HudModuleId) {
  void PREFETCH[id]?.();
}

export function prefetchHudModules(ids: HudModuleId[]) {
  ids.forEach(prefetchHudModule);
}

export function ModuleLoading() {
  return (
    <p className="py-10 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400/45 animate-pulse">
      Loading module…
    </p>
  );
}
