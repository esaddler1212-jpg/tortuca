import { lazy } from "react";

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

export function ModuleLoading() {
  return <p className="py-10 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400/45">Loading module…</p>;
}
