import { useState } from "react";
import type { TierAState } from "../../shared/tierAOps";
import { bumpBriefingPref, type BriefingSectionId } from "../../shared/tierAOps";
import {
  applyCalendarProposal,
  ingestWearable,
  linkSms,
  placeVoiceCall,
  runInboxTriage,
  queueTriageDraft,
} from "../lib/tierAApi";

interface Props {
  tierA: TierAState;
  patchTierA: (p: Partial<TierAState>) => void;
  timeZone: string;
  onOpenChannels?: () => void;
}

export function TierAPanel({ tierA, patchTierA, timeZone, onOpenChannels }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [wearSleep, setWearSleep] = useState("");
  const [wearSteps, setWearSteps] = useState("");
  const [phone, setPhone] = useState("");

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const pendingCal = (tierA.calendarProposals ?? []).filter((p) => p.status === "pending");
  const openCmt = (tierA.commitments ?? []).filter((c) => !c.done);
  const voicePending = (tierA.voiceCalls ?? []).filter((v) => v.status === "pending");
  const preps = tierA.meetingPreps ?? [];
  const triage = tierA.inboxTriage ?? [];

  const rate = (id: BriefingSectionId, delta: number) => {
    patchTierA({ briefingPrefs: bumpBriefingPref(tierA.briefingPrefs, id, delta) });
  };

  if (
    !pendingCal.length &&
    !openCmt.length &&
    !voicePending.length &&
    !preps.length &&
    !triage.length &&
    !tierA.wearable
  ) {
    return (
      <section className="panel p-4 border border-alfred-border/50 space-y-3">
        <p className="text-xs font-mono uppercase tracking-wider text-alfred-gold">Tier A ops</p>
        <p className="text-sm text-alfred-mist">Ask Iris to add commitments, meeting prep, or calendar proposals — they appear here for your OK.</p>
        <OpsToolbar
          busy={busy}
          run={run}
          onTriage={() => run("triage", async () => { await runInboxTriage(); })}
          onSms={() => run("sms", async () => {
            const r = await linkSms(phone || undefined);
            alert(r.hint);
          })}
          phone={phone}
          setPhone={setPhone}
          wearSleep={wearSleep}
          wearSteps={wearSteps}
          setWearSleep={setWearSleep}
          setWearSteps={setWearSteps}
          onWearable={() =>
            run("wear", async () => {
              await ingestWearable({
                source: "manual",
                sleepHours: wearSleep ? Number(wearSleep) : undefined,
                steps: wearSteps ? Number(wearSteps) : undefined,
              });
            })
          }
        />
        {err && <p className="text-xs text-red-300">{err}</p>}
      </section>
    );
  }

  return (
    <section className="panel p-4 border border-alfred-gold/30 space-y-4">
      <p className="text-xs font-mono uppercase tracking-wider text-alfred-gold">Needs your OK</p>
      {err && <p className="text-xs text-red-300">{err}</p>}

      {pendingCal.map((p) => (
        <div key={p.id} className="rounded-md border border-alfred-gold/30 bg-black/30 p-3 text-sm">
          <p className="text-alfred-gold text-xs uppercase">{p.kind} calendar</p>
          <p className="font-medium">{p.title}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="btn-ghost text-xs border border-alfred-gold/50"
              disabled={!!busy}
              onClick={() =>
                run(p.id, async () => {
                  await applyCalendarProposal(p.id, timeZone);
                  patchTierA({
                    calendarProposals: (tierA.calendarProposals ?? []).map((x) =>
                      x.id === p.id ? { ...x, status: "applied" } : x,
                    ),
                  });
                })
              }
            >
              Apply
            </button>
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() =>
                patchTierA({
                  calendarProposals: (tierA.calendarProposals ?? []).map((x) =>
                    x.id === p.id ? { ...x, status: "discarded" } : x,
                  ),
                })
              }
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}

      {voicePending.map((c) => (
        <div key={c.id} className="rounded-md border border-cyan-500/30 p-3 text-sm">
          <p className="text-xs text-cyan-200/80">Outbound call — {c.label}</p>
          <p className="text-xs text-alfred-mist mt-1">{c.script}</p>
          <button
            type="button"
            className="btn-ghost text-xs mt-2 border border-cyan-400/40"
            disabled={!!busy}
            onClick={() => run(c.id, async () => { await placeVoiceCall(c.id); })}
          >
            Place call
          </button>
        </div>
      ))}

      {preps.slice(-2).map((m) => (
        <MeetingPrepCard key={m.id} prep={m} patchTierA={patchTierA} tierA={tierA} />
      ))}

      {openCmt.length > 0 && (
        <div className="text-sm">
          <p className="text-xs uppercase text-alfred-mist mb-1">Commitments</p>
          <ul className="space-y-1">
            {openCmt.slice(0, 5).map((c) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span>
                  {c.promise} → {c.owedTo}
                  {c.dueDate ? ` by ${c.dueDate}` : ""}
                </span>
                <button
                  type="button"
                  className="text-xs text-alfred-gold"
                  onClick={() =>
                    patchTierA({
                      commitments: (tierA.commitments ?? []).map((x) =>
                        x.id === c.id ? { ...x, done: true, completedAt: new Date().toISOString() } : x,
                      ),
                    })
                  }
                >
                  Done
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {triage.length > 0 && (
        <div className="text-sm space-y-2">
          <p className="text-xs uppercase text-alfred-mist">Inbox triage</p>
          {triage.slice(0, 4).map((t) => (
            <div key={t.id} className="border-t border-alfred-border/30 pt-2">
              <p className={t.urgency === "high" ? "text-alfred-gold" : ""}>
                {t.from}: {t.subject}
              </p>
              {t.suggestedReply && !t.draftQueuedAt && (
                <button
                  type="button"
                  className="text-xs text-alfred-gold underline mt-1"
                  disabled={!!busy}
                  onClick={() =>
                    run(`draft-${t.id}`, async () => {
                      await queueTriageDraft(t.id);
                      patchTierA({
                        inboxTriage: (tierA.inboxTriage ?? []).map((x) =>
                          x.id === t.id ? { ...x, draftQueuedAt: new Date().toISOString() } : x,
                        ),
                      });
                      onOpenChannels?.();
                    })
                  }
                >
                  Queue reply in Drafts
                </button>
              )}
              {t.draftQueuedAt && <p className="text-[10px] text-alfred-mist mt-1">Draft queued — open Drafts to approve.</p>}
            </div>
          ))}
          <button
            type="button"
            className="btn-ghost text-xs"
            disabled={!!busy}
            onClick={() => run("triage", async () => { await runInboxTriage(); })}
          >
            Refresh triage
          </button>
        </div>
      )}

      <BriefingPrefChips rate={rate} />

      <OpsToolbar
        busy={busy}
        run={run}
        onTriage={() => run("triage", async () => { await runInboxTriage(); })}
        onSms={() => run("sms", async () => { const r = await linkSms(phone || undefined); alert(r.hint); })}
        phone={phone}
        setPhone={setPhone}
        wearSleep={wearSleep}
        wearSteps={wearSteps}
        setWearSleep={setWearSleep}
        setWearSteps={setWearSteps}
        onWearable={() =>
          run("wear", async () => {
            await ingestWearable({
              source: "manual",
              sleepHours: wearSleep ? Number(wearSleep) : undefined,
              steps: wearSteps ? Number(wearSteps) : undefined,
            });
          })
        }
      />
    </section>
  );
}

function BriefingPrefChips({ rate }: { rate: (id: BriefingSectionId, d: number) => void }) {
  return (
    <div className="border-t border-alfred-border/40 pt-3">
      <p className="text-xs text-alfred-mist mb-2">Briefing focus (adaptive)</p>
      <div className="flex flex-wrap gap-2 text-[11px]">
        {(["weather", "inbox", "stocks", "woodhouse"] as BriefingSectionId[]).map((id) => (
          <span key={id} className="inline-flex items-center gap-1 border border-alfred-border/50 rounded-full px-2 py-0.5">
            {id}
            <button type="button" onClick={() => rate(id, 0.15)} aria-label={`More ${id}`}>
              +
            </button>
            <button type="button" onClick={() => rate(id, -0.15)} aria-label={`Less ${id}`}>
              −
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function MeetingPrepCard({
  prep,
  tierA,
  patchTierA,
}: {
  prep: NonNullable<TierAState["meetingPreps"]>[number];
  tierA: TierAState;
  patchTierA: Props["patchTierA"];
}) {
  return (
    <div className="rounded-md border border-alfred-border/50 p-3 text-sm">
      <p className="font-medium">{prep.title}</p>
      <p className="text-xs text-alfred-mist mt-1">{prep.objective}</p>
      <ul className="list-disc list-inside text-xs mt-2 text-alfred-cream/90">
        {prep.talkingPoints.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <button
        type="button"
        className="text-xs text-alfred-gold mt-2"
        onClick={() =>
          patchTierA({
            meetingPreps: (tierA.meetingPreps ?? []).map((p) =>
              p.id === prep.id ? { ...p, rehearsalNote: "Rehearsal flagged — practice out loud with Iris." } : p,
            ),
          })
        }
      >
        Mark rehearsal
      </button>
    </div>
  );
}

function OpsToolbar(props: {
  busy: string | null;
  run: (k: string, fn: () => Promise<void>) => void;
  onTriage: () => void;
  onSms: () => void;
  phone: string;
  setPhone: (s: string) => void;
  wearSleep: string;
  wearSteps: string;
  setWearSleep: (s: string) => void;
  setWearSteps: (s: string) => void;
  onWearable: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-xs pt-2 border-t border-alfred-border/30">
      <button type="button" className="btn-ghost" disabled={!!props.busy} onClick={props.onTriage}>
        Run inbox triage
      </button>
      <input
        className="bg-black/40 border border-alfred-border/50 rounded px-2 py-1 w-28"
        placeholder="SMS phone"
        value={props.phone}
        onChange={(e) => props.setPhone(e.target.value)}
      />
      <button type="button" className="btn-ghost" disabled={!!props.busy} onClick={props.onSms}>
        Link SMS
      </button>
      <input
        className="bg-black/40 border border-alfred-border/50 rounded px-2 py-1 w-16"
        placeholder="Sleep h"
        value={props.wearSleep}
        onChange={(e) => props.setWearSleep(e.target.value)}
      />
      <input
        className="bg-black/40 border border-alfred-border/50 rounded px-2 py-1 w-16"
        placeholder="Steps"
        value={props.wearSteps}
        onChange={(e) => props.setWearSteps(e.target.value)}
      />
      <button type="button" className="btn-ghost" disabled={!!props.busy} onClick={props.onWearable}>
        Log wearable
      </button>
    </div>
  );
}
