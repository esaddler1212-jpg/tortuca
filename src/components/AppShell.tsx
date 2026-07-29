import { NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const nav = [
  { to: "/", label: "Pulse", end: true },
  { to: "/orders", label: "Orders" },
  { to: "/marketing", label: "Growth" },
];

export function AppShell() {
  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: api.getMetrics,
    refetchInterval: 60_000,
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-12 pt-6 md:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-supply-400">
            Woodhouse protocol · store node
          </p>
          <h1 className="font-display text-3xl text-supply-50 md:text-4xl">
            {metrics?.shopName ?? "Easy Supply Co."}
          </h1>
          <p className="mt-1 text-sm text-supply-200/70">Command center — know where you stand, what to do next</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {metrics?.dataSource === "demo" && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
              Demo data — add Shopify env vars to go live
            </span>
          )}
          {metrics && metrics.pendingApprovals > 0 && (
            <span className="rounded-full border border-supply-500/50 bg-supply-600/20 px-3 py-1 text-xs font-medium text-supply-100">
              {metrics.pendingApprovals} awaiting approval
            </span>
          )}
        </div>
      </header>

      <nav className="mb-8 flex gap-1 rounded-xl bg-ink-900/80 p-1 ring-1 ring-white/5">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-medium transition ${
                isActive
                  ? "bg-supply-600/30 text-supply-50 shadow-inner ring-1 ring-supply-500/30"
                  : "text-supply-200/60 hover:text-supply-100"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-white/5 pt-6 text-center text-xs text-supply-200/40">
        Goal: $5,000/mo revenue · Sync-ready for Alfred via{" "}
        <code className="text-supply-400/80">GET /api/woodhouse/snapshot</code>
      </footer>
    </div>
  );
}
