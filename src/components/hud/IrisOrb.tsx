import type { ConversationPhase } from "../../hooks/useConversation";
import type { HudModuleId } from "../../../shared/hudModules";
import type { IrisOrbStyleId } from "../../../shared/irisOrbStyles";
import { readLastDelegate } from "../../../shared/irisTeamActivity";
import { specialistLabel } from "../../../shared/irisTeam";
import { CoreRing } from "./CoreRing";
import { VoiceWaveform } from "./VoiceWaveform";
import { CinemaFaceOrb } from "./orb/CinemaFaceOrb";
import { SonarOrbOverlay } from "./orb/SonarOrbOverlay";

export type IrisOrbProps = {
  style: IrisOrbStyleId;
  size?: "home" | "mini";
  lines: [string, string];
  status: "ok" | "degraded" | "offline";
  phase: ConversationPhase;
  replyTick?: number;
  onActivate?: () => void;
  active?: boolean;
  waiting?: boolean;
  /** Honour combo K.A.R.A. filament when style is classic ops-console */
  karaCombo?: boolean;
  quick?: {
    unread: number;
    pendingTodos: number;
    pulseUrgent: boolean;
    onOpenModule: (id: HudModuleId) => void;
    interim?: string;
    asksLeft?: number | null;
  };
};

const WEDGE: { id: HudModuleId; label: string; at: string }[] = [
  { id: "inbox", label: "In", at: "right-2 top-1/2 -translate-y-1/2" },
  { id: "today", label: "Do", at: "left-1/2 top-2 -translate-x-1/2" },
  { id: "vitals", label: "Pulse", at: "left-2 top-1/2 -translate-y-1/2" },
  { id: "plan", label: "Plan", at: "left-1/2 bottom-2 -translate-x-1/2" },
];

function badgeFor(id: HudModuleId, quick: NonNullable<IrisOrbProps["quick"]>): string | null {
  if (id === "inbox" && quick.unread > 0) return String(quick.unread > 99 ? "99+" : quick.unread);
  if (id === "today" && quick.pendingTodos > 0) return String(quick.pendingTodos > 99 ? "99+" : quick.pendingTodos);
  if (id === "vitals" && quick.pulseUrgent) return "!";
  return null;
}

function OpsQuickWedges({ quick }: { quick: NonNullable<IrisOrbProps["quick"]> }) {
  return (
    <>
      {WEDGE.map((w) => {
        const badge = badgeFor(w.id, quick);
        return (
          <button
            key={w.id}
            type="button"
            className={`absolute z-[2] flex min-h-[36px] min-w-[36px] flex-col items-center justify-center rounded-full border border-cyan-400/35 bg-black/75 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wide text-cyan-100/90 shadow-sm backdrop-blur-sm hover:border-cyan-300/60 ${w.at}`}
            onClick={(e) => {
              e.stopPropagation();
              quick.onOpenModule(w.id);
            }}
            aria-label={`Open ${w.id}${badge ? `, ${badge} items` : ""}`}
          >
            <span>{w.label}</span>
            {badge ? <span className="text-[10px] font-bold text-amber-300">{badge}</span> : null}
          </button>
        );
      })}
    </>
  );
}

function TeamRosterChip() {
  const last = readLastDelegate();
  if (!last) return null;
  const label = specialistLabel(last.specialist).split(" ")[0] ?? last.specialist;
  return (
    <span className="pointer-events-none absolute bottom-[18%] left-1/2 z-[2] -translate-x-1/2 rounded-full border border-violet-400/40 bg-violet-950/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-violet-100/90">
      Last · {label}
    </span>
  );
}

function LiveCaption({ phase, interim, active }: { phase: ConversationPhase; interim?: string; active?: boolean }) {
  if (!active && phase === "idle") return null;
  const text =
    phase === "listening" && interim?.trim()
      ? interim.trim()
      : phase === "thinking"
        ? "Processing…"
        : phase === "speaking"
          ? "Speaking…"
          : "";
  if (!text) return null;
  return (
    <p className="pointer-events-none absolute bottom-[8%] left-1/2 z-[2] w-[78%] -translate-x-1/2 truncate text-center font-mono text-[9px] leading-snug text-cyan-100/85">
      {text}
    </p>
  );
}

function AskBudget({ asksLeft }: { asksLeft?: number | null }) {
  if (asksLeft == null || asksLeft < 0) return null;
  return (
    <span className="pointer-events-none absolute right-[14%] top-[14%] z-[2] rounded border border-cyan-500/25 bg-black/70 px-1.5 py-0.5 font-mono text-[8px] text-cyan-400/80">
      {asksLeft} asks left
    </span>
  );
}

/** Home-screen Iris core — style-aware wrapper around CoreRing and functional overlays. */
export function IrisOrb({
  style,
  size = "home",
  lines,
  status,
  phase,
  replyTick = 0,
  onActivate,
  active = false,
  waiting = false,
  karaCombo = false,
  quick,
}: IrisOrbProps) {
  const effective =
    style === "capsule" && size === "home"
      ? "classic"
      : style === "filament"
        ? "filament"
        : style;

  const kara =
    effective === "filament" ? true : effective === "classic" || effective === "lantern" ? karaCombo : false;

  const shellClass =
    effective === "lantern"
      ? "iris-orb-lantern"
      : effective === "sonar"
        ? "iris-orb-sonar"
        : effective === "waveform-arc"
          ? "iris-orb-waveform"
          : "";

  if (size === "mini" && style === "capsule") {
    return (
      <button
        type="button"
        onClick={onActivate}
        className="flex min-h-[44px] w-full items-center gap-2 rounded-full border border-cyan-400/35 bg-black/90 px-3 py-2 text-left"
        aria-label="Talk to Iris"
      >
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            phase === "listening" ? "animate-pulse bg-cyan-300" : phase === "speaking" ? "bg-cyan-400" : "bg-cyan-600/70"
          }`}
        />
        <span className="truncate font-mono text-[10px] uppercase tracking-wider text-cyan-50">
          {phase === "idle" ? (waiting ? "Tap · brief ready" : "Iris standby") : phase}
        </span>
        {quick?.interim?.trim() ? (
          <span className="ml-auto max-w-[45%] truncate text-[10px] text-cyan-100/80">{quick.interim}</span>
        ) : null}
      </button>
    );
  }

  if (effective === "cinema-eye") {
    return (
      <div
        className={`relative mx-auto w-full max-w-[420px] ${onActivate ? "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-alfred-gold" : ""}`}
        onClick={onActivate}
        onKeyDown={(e) => {
          if (onActivate && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onActivate();
          }
        }}
        role={onActivate ? "button" : undefined}
        tabIndex={onActivate ? 0 : undefined}
        aria-label="Talk to Iris"
      >
        <CinemaFaceOrb phase={phase} lines={lines} status={status} />
        {quick ? <OpsQuickWedges quick={quick} /> : null}
      </div>
    );
  }

  const core = (
    <CoreRing
      lines={lines}
      status={status}
      phase={phase}
      replyTick={replyTick}
      onActivate={onActivate}
      active={active}
      waiting={waiting}
      kara={kara}
    />
  );

  const showOps = (effective === "ops-console" || effective === "status-cross") && quick;
  const showWave = effective === "waveform-arc";
  const showSonar = effective === "sonar";
  const showTeam = effective === "team-roster";
  const showCaption = effective === "ops-console" || effective === "waveform-arc";
  const crossBold = effective === "status-cross";

  return (
    <div className={`relative ${shellClass}`}>
      {showSonar ? <SonarOrbOverlay phase={phase} /> : null}
      {core}
      {showOps ? <OpsQuickWedges quick={quick!} /> : null}
      {crossBold && quick ? (
        <div className="pointer-events-none absolute inset-0 z-[1]">
          {WEDGE.map((w) => {
            const badge = badgeFor(w.id, quick);
            if (!badge) return null;
            return (
              <span
                key={w.id}
                className={`absolute flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-400/80 bg-amber-950/90 text-xs font-bold text-amber-100 ${w.at}`}
              >
                {badge}
              </span>
            );
          })}
        </div>
      ) : null}
      {showTeam ? <TeamRosterChip /> : null}
      {showCaption ? <LiveCaption phase={phase} interim={quick?.interim} active={active} /> : null}
      {effective === "ops-console" && quick ? <AskBudget asksLeft={quick.asksLeft} /> : null}
      {showWave ? (
        <div className="pointer-events-none absolute bottom-[4%] left-1/2 z-[2] w-[70%] -translate-x-1/2 opacity-90">
          <VoiceWaveform phase={phase} bars={28} interim={quick?.interim ?? ""} />
        </div>
      ) : null}
    </div>
  );
}

/** Dock / cinema strip avatar — matches selected orb style when possible. */
export function IrisOrbMini(props: Omit<IrisOrbProps, "size">) {
  return <IrisOrb {...props} size="mini" />;
}