import { useState } from "react";
import { Briefcase, Loader2, Search } from "lucide-react";
import type { ResearchArea } from "../../shared/businessResearch";
import { RESEARCH_PRESETS } from "../../shared/businessResearch";
import type { BusinessResearchResult } from "../../shared/businessResearch";

const AREAS: ResearchArea[] = ["General", "ECS", "Tortuga", "North Star", "Easy Supply", "2EASY", "Personal"];

interface Props {
  googleConnected: boolean;
  loading: boolean;
  error: string | null;
  last: BusinessResearchResult | null;
  onResearch: (query: string, area: ResearchArea) => Promise<BusinessResearchResult | null>;
  onConnectGoogle: () => void;
}

export function BusinessResearcherPanel({ googleConnected, loading, error, last, onResearch, onConnectGoogle }: Props) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<ResearchArea>("ECS");

  const submit = () => {
    if (!query.trim() || loading) return;
    void onResearch(query.trim(), area);
  };

  return (
    <section className="panel-hud p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="hud-label flex items-center gap-2">
            <Briefcase className="h-4 w-4" aria-hidden /> Business Researcher
          </p>
          <p className="text-sm text-alfred-mist mt-1">
            Sourced market and ops briefs with live web research — saved to Hub memos.
          </p>
        </div>
      </div>

      {!googleConnected ? (
        <div className="rounded-md border border-amber-400/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-100/90">
          Connect Google in Settings — research saves to your Hub memos on your account.
          <button type="button" className="btn-gold ml-2 mt-2 w-full sm:w-auto text-xs" onClick={onConnectGoogle}>
            Connect Google
          </button>
        </div>
      ) : (
        <p className="text-xs text-cyan-400/55 font-mono">Saved to Hub memos on your account · up to 8 runs per day.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {RESEARCH_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="rounded-full border border-alfred-border/60 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-alfred-mist hover:border-alfred-gold/50 hover:text-alfred-gold"
            onClick={() => {
              setQuery(p.query);
              setArea(p.area);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="block text-xs text-alfred-mist" htmlFor="research-area">
        ECS area
      </label>
      <select
        id="research-area"
        className="input-field mb-2"
        value={area}
        onChange={(e) => setArea(e.target.value as ResearchArea)}
      >
        {AREAS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <label className="block text-xs text-alfred-mist" htmlFor="research-query">
        What should we research?
      </label>
      <textarea
        id="research-query"
        className="input-field min-h-[88px] resize-y"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. Who sponsors Bay Area YouTube doc series and what do deals look like?"
      />

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <button type="button" className="btn-gold w-full sm:w-auto" disabled={loading || !query.trim() || !googleConnected} onClick={submit}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Researching…
          </>
        ) : (
          <>
            <Search className="h-4 w-4" aria-hidden /> Run research
          </>
        )}
      </button>

      {last ? (
        <div className="rounded-md border border-alfred-border/50 bg-black/40 p-3 text-sm max-h-64 overflow-y-auto">
          <p className="text-alfred-gold font-medium mb-2">{last.title}</p>
          <pre className="whitespace-pre-wrap font-sans text-alfred-cream/90 text-xs leading-relaxed">{last.report.slice(0, 2400)}{last.report.length > 2400 ? "…" : ""}</pre>
          <p className="text-xs text-alfred-mist mt-2">Full report → Hub → Memos</p>
        </div>
      ) : null}
    </section>
  );
}
