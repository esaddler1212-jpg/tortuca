import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import type { HudModuleId } from "../../../shared/hudModules";
import { moduleLabel } from "../../../shared/hudModules";
import {
  IRIS_CAPTAIN,
  IRIS_TEAM,
  specialistById,
  specialistLabel,
  type IrisSpecialistId,
} from "../../../shared/irisTeam";
import { formatDelegateAgo, readLastDelegate, teamEfficiencySummary, readDelegateHistory, type IrisDelegateLog } from "../../../shared/irisTeamActivity";

interface Props {
  timeZone: string;
  onOpenModule: (id: HudModuleId) => void;
  onAskSpecialist?: (id: IrisSpecialistId) => void;
}

export function TeamPanel({ timeZone, onOpenModule, onAskSpecialist }: Props) {
  const [last, setLast] = useState<IrisDelegateLog | null>(() => readLastDelegate());
  const [recent, setRecent] = useState<IrisDelegateLog[]>(() => readDelegateHistory().slice(0, 8));
  const [ops, setOps] = useState(() => teamEfficiencySummary(readDelegateHistory()));

  useEffect(() => {
    const sync = () => {
      const hist = readDelegateHistory();
      setLast(readLastDelegate());
      setRecent(hist.slice(0, 8));
      setOps(teamEfficiencySummary(hist));
    };
    sync();
    window.addEventListener("storage", sync);
    const id = window.setInterval(sync, 4000);
    return () => {
      window.removeEventListener("storage", sync);
      window.clearInterval(id);
    };
  }, []);

  return (
    <section className="panel-hud p-5 space-y-5">
      <div>
        <p className="hud-label flex items-center gap-2">
          <Users className="h-4 w-4" aria-hidden /> Iris team
        </p>
        <p className="text-sm text-alfred-mist mt-1">
          One specialist owns each module; they report to Iris, and Iris reports to you in one voice.
        </p>
      </div>

      {/* Org chart */}
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="rounded-md border border-alfred-gold/40 bg-amber-950/20 px-4 py-2 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-alfred-gold/70">You</p>
          <p className="font-display text-sm text-alfred-cream">E</p>
        </div>
        <div className="h-6 w-px bg-cyan-400/30" aria-hidden />
        <div
          className="rounded-lg border border-cyan-400/35 bg-cyan-950/25 px-5 py-3 text-center"
          style={{ boxShadow: "0 0 28px rgb(34 211 238 / 0.12)" }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/70">{IRIS_CAPTAIN.title}</p>
          <p className="font-display text-lg text-cyan-100">{IRIS_CAPTAIN.name}</p>
          <p className="text-[11px] text-cyan-100/60 mt-1">Relays specialist reports · consult_specialist</p>
        </div>
        <div className="relative mt-2 w-full max-w-md">
          <div className="absolute left-1/2 top-0 h-px w-[72%] -translate-x-1/2 bg-cyan-400/25" aria-hidden />
          <ul className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-3 lg:grid-cols-5">
            {IRIS_TEAM.map((s) => (
              <li key={s.id} className="relative flex flex-col items-center">
                <div className="absolute -top-4 left-1/2 h-4 w-px bg-cyan-400/20" aria-hidden />
                <SpecialistCard specialist={s.id} onOpenModule={onOpenModule} onAskSpecialist={onAskSpecialist} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {ops && !ops.includes("no specialist delegates") ? (
        <div className="rounded-md border border-indigo-400/25 bg-indigo-950/20 px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-indigo-300/70">Woodhouse · duplicate guard</p>
          <p className="text-xs text-cyan-50/90 mt-1 leading-relaxed">{ops.replace(/^Iris team ops \(Woodhouse\):\s*/, "")}</p>
        </div>
      ) : null}

      {last ? (
        <div className="rounded-md border border-cyan-400/25 bg-black/35 px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/60">Last delegate</p>
          <p className="text-sm text-cyan-50/95 mt-1">
            <span style={{ color: specialistById(last.specialist)?.color }}>{specialistLabel(last.specialist)}</span>
            {" → Iris · "}
            <span className="text-cyan-400/70">{formatDelegateAgo(last.at, timeZone)}</span>
          </p>
          {last.task ? <p className="text-xs text-alfred-mist mt-1 line-clamp-2">&ldquo;{last.task}&rdquo;</p> : null}
        </div>
      ) : (
        <p className="text-xs text-alfred-mist font-mono">No delegates yet — try &ldquo;Iris, have Scout research…&rdquo;</p>
      )}

      {recent.length > 1 ? (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/50 mb-2">Recent activity</p>
          <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {recent.map((e) => (
              <li key={`${e.specialist}-${e.at}`} className="rounded border border-cyan-400/10 bg-black/20 px-2 py-1.5 text-xs">
                <span className="font-mono" style={{ color: specialistById(e.specialist)?.color }}>
                  {specialistLabel(e.specialist)}
                </span>
                <span className="text-cyan-400/50"> · {formatDelegateAgo(e.at, timeZone)}</span>
                {e.task ? <p className="text-alfred-mist line-clamp-1 mt-0.5">&ldquo;{e.task}&rdquo;</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/50">Voice examples</p>
        <ul className="text-xs text-alfred-mist space-y-1 list-disc pl-4">
          <li>Open the team</li>
          <li>Ask Ledger what&apos;s on Today</li>
          <li>Have Courier summarize unread mail</li>
          <li>What does Sentinel see on Pulse?</li>
          <li>Ask Woodhouse if we&apos;re duplicating work</li>
          <li>Have Scout brief me on Bay Area doc sponsors</li>
        </ul>
      </div>
    </section>
  );
}

function SpecialistCard({
  specialist,
  onOpenModule,
  onAskSpecialist,
}: {
  specialist: IrisSpecialistId;
  onOpenModule: (id: HudModuleId) => void;
  onAskSpecialist?: (id: IrisSpecialistId) => void;
}) {
  const s = specialistById(specialist);
  if (!s) return null;
  return (
    <div className="w-full">
      <button
        type="button"
        className="hud-tile w-full text-left border-l-2 pl-2 transition hover:border-cyan-300/50"
        style={{ borderLeftColor: s.color }}
        onClick={() => onOpenModule(s.module)}
      >
        <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: s.color }}>
          {s.name}
        </p>
        <p className="text-[10px] text-cyan-100/75 leading-snug">{s.title}</p>
        <p className="text-[9px] text-cyan-400/45 mt-1">→ {moduleLabel(s.module)}</p>
      </button>
      {onAskSpecialist ? (
        <button
          type="button"
          className="mt-1 w-full text-[9px] font-mono uppercase tracking-wider text-cyan-400/60 hover:text-cyan-300"
          onClick={() => onAskSpecialist(specialist)}
        >
          Ask Iris
        </button>
      ) : null}
    </div>
  );
}
