import { ExternalLink, Hammer, MonitorPlay, Wrench } from "lucide-react";
import { isSafePublicUrl } from "../../shared/hub";
import { WORKSHOP_ENTRIES, type WorkshopEntry, type WorkshopKind } from "../../shared/workshops";

const KIND_LABEL: Record<WorkshopKind, string> = {
  local: "Local clone",
  hosted: "Browser",
  workflow: "Workflow",
};

function KindIcon({ kind }: { kind: WorkshopKind }) {
  if (kind === "local") return <MonitorPlay className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  if (kind === "hosted") return <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  return <Wrench className="h-3.5 w-3.5 shrink-0" aria-hidden />;
}

function WorkshopCard({ entry }: { entry: WorkshopEntry }) {
  const primary = entry.hostedUrl && entry.kind === "local" ? entry.hostedUrl : entry.url;
  const safe = primary && isSafePublicUrl(primary);
  return (
    <li className="rounded-lg border border-alfred-border/60 bg-black/20 px-3 py-3 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <WorkshopTitle entry={entry} href={safe ? primary : undefined} />
        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-alfred-mist border border-alfred-border/50 rounded-full px-2 py-0.5">
          <KindIcon kind={entry.kind} />
          {KIND_LABEL[entry.kind]}
        </span>
      </div>
      <p className="text-sm text-alfred-mist leading-relaxed">{entry.summary}</p>
      {entry.bootstrap ? (
        <p className="font-mono text-[11px] text-cyan-100/80">
          <Hammer className="inline h-3 w-3 mr-1 text-cyan-400/70" aria-hidden />
          <code>{entry.bootstrap}</code>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {safe ? (
          <a
            className="inline-flex items-center gap-1 rounded-full border border-alfred-border/60 px-2.5 py-1 text-alfred-gold hover:bg-alfred-gold/10"
            href={primary}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            {entry.kind === "local" ? "Open hosted demo" : "Open"}
          </a>
        ) : null}
        {entry.kind === "local" && isSafePublicUrl(entry.url) ? (
          <a
            className="inline-flex items-center gap-1 rounded-full border border-alfred-border/60 px-2.5 py-1 text-alfred-mist hover:text-alfred-gold"
            href={entry.url}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        ) : null}
        {entry.doc ? (
          <a
            className="inline-flex items-center gap-1 rounded-full border border-alfred-border/60 px-2.5 py-1 text-alfred-mist hover:text-alfred-gold"
            href={`/${entry.doc.replace(/^docs\//, "docs/")}`}
            onClick={(e) => {
              e.preventDefault();
              window.open(`https://github.com/esaddler1212-jpg/tortuca/blob/main/${entry.doc}`, "_blank", "noopener,noreferrer");
            }}
          >
            Doc in repo
          </a>
        ) : null}
      </div>
      {entry.tags?.length ? (
        <p className="font-mono text-[10px] text-alfred-mist/80">{entry.tags.join(" · ")}</p>
      ) : null}
    </li>
  );
}

function WorkshopTitle({ entry, href }: { entry: WorkshopEntry; href?: string }) {
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="font-display text-base text-alfred-cream hover:text-alfred-gold">
        {entry.title}
      </a>
    );
  }
  return <p className="font-display text-base text-alfred-cream">{entry.title}</p>;
}

/** Plan tab: creative workshops catalog (local toolchains + hosted apps). */
export function WorkshopsPanel() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-alfred-mist leading-relaxed">
        Picks for sparks, film, and game art. Clone and run on your machine — keys stay local. Featured:{" "}
        <strong className="text-alfred-cream font-normal">Open Generative AI</strong> for stills and video when today&apos;s prompt needs a visual.
      </p>
      <ul className="space-y-3">
        {WORKSHOP_ENTRIES.map((e) => (
          <WorkshopCard key={e.id} entry={e} />
        ))}
      </ul>
      <p className="text-[11px] text-alfred-mist font-mono">
        Catalog: workshops/tortuca-creative.json · guardrails in AGENTS.md
      </p>
    </div>
  );
}
