import type { Tab } from "./appTabs";
import { useDesktopNav } from "./useDesktopNav";

export type { Tab };

export const TABS: { id: Tab; label: string; shortLabel: string }[] = [
  { id: "log", label: "Log", shortLabel: "Log" },
  { id: "followup", label: "Follow-up", shortLabel: "Follow" },
  { id: "group", label: "Group", shortLabel: "Group" },
  { id: "debrief", label: "Debrief", shortLabel: "Debrief" },
  { id: "reports", label: "Reports", shortLabel: "Reports" },
  { id: "impact", label: "Impact", shortLabel: "Impact" },
  { id: "settings", label: "Settings", shortLabel: "Settings" },
];

const MOBILE_MORE: Tab[] = ["reports", "impact", "settings"];

function tabLabel(
  t: { label: string; shortLabel: string },
  desktop: boolean,
): string {
  return desktop ? t.label : t.shortLabel;
}

export default function AppNav({
  tab,
  followUpBadge,
  onSelect,
  moreOpen,
  onMoreToggle,
}: {
  tab: Tab;
  followUpBadge: number;
  onSelect: (id: Tab) => void;
  moreOpen: boolean;
  onMoreToggle: (open: boolean) => void;
}) {
  const desktop = useDesktopNav();
  const moreActive = MOBILE_MORE.includes(tab);

  const select = (id: Tab) => {
    onSelect(id);
    onMoreToggle(false);
  };

  return (
    <nav className="app-nav" aria-label="Main">
      <div className="app-nav-primary">
        {TABS.filter((t) => !MOBILE_MORE.includes(t.id)).map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? "active" : ""}`}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => select(t.id)}
          >
            {tabLabel(t, desktop)}
            {t.id === "followup" && followUpBadge > 0 && (
              <span className="tab-badge">{followUpBadge}</span>
            )}
          </button>
        ))}
        <button
          type="button"
          className={`tab tab-more-trigger ${moreActive ? "active" : ""}`}
          aria-expanded={moreOpen}
          aria-haspopup="true"
          onClick={() => onMoreToggle(!moreOpen)}
        >
          More
          {moreActive && <span className="tab-dot" aria-hidden="true" />}
        </button>
      </div>

      <div className="app-nav-secondary">
        {TABS.filter((t) => MOBILE_MORE.includes(t.id)).map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? "active" : ""}`}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => select(t.id)}
          >
            {tabLabel(t, desktop)}
          </button>
        ))}
      </div>

      {moreOpen && (
        <div className="nav-more-menu" role="menu">
          {MOBILE_MORE.map((id) => {
            const t = TABS.find((x) => x.id === id)!;
            return (
              <button
                key={id}
                type="button"
                role="menuitem"
                className={`nav-more-item ${tab === id ? "active" : ""}`}
                onClick={() => select(id)}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <p className="nav-sidebar-hint">
        Wider layout on desktop — log form and today&apos;s list appear side by
        side.
      </p>
    </nav>
  );
}
