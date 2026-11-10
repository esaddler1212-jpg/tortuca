# IRIS competitive research — Jarvis-class executive assistants

**Updated:** November 2026  
**Purpose:** Benchmark IRIS against similar “AI chief of staff” products and list **capabilities peers have that IRIS lacks**, filtered by fit with ECS/Eric’s life, the Netlify PWA architecture, and existing guardrails (`shared/agentGuardrails.ts`).

---

## What IRIS already is (baseline)

IRIS is a **module-driven HUD PWA**, not a single-thread chat app. Voice and `/api/ask` sit on top of **Today, Vitals, Inbox, Plan, Hub, Pulse, Team**, and related surfaces.

| Area | IRIS today | Primary code / policy |
|------|------------|------------------------|
| Voice + tools | `add_todo`, `open_module`, `remember`/`forget`, `web_search`/`fetch`, `track_flight`, `consult_specialist` | `netlify/functions/_iris.ts`, `shared/agentGuardrails.ts` |
| Specialists | Eleven module owners; **Scout** runs real research; **Scribe** drafts; duplicate delegate blocking | `shared/irisTeam.ts`, `netlify/functions/_irisSpecialists.ts` |
| Calendar / mail | **Read** Google calendar + inbox (subjects/senders); Woodhouse ECS timeline; school calendar, leave-by, bedtime | `src/App.tsx`, `shared/schoolCalendar.ts`, `shared/commute.ts` |
| Outbound comms | Channel **drafts** with human approval; Family Purpose **isolated** (no outbound) | `netlify/functions/channel-send.ts`, Channels UI |
| Morning surface | Weather, unread count, todos, next event title, Woodhouse lines, stocks | `src/components/MorningBriefing.tsx` |
| Maps / pulse | Bay Area Pulse (quakes, fires, flights, ISS, ships), flight track tool | Vitals module, `track_flight` |
| Research | Business Researcher with daily caps | `netlify/functions/business-research.ts` |
| Safety | No calendar edits, no autonomous send/spend; no student names in Iris context; `safeFact()` | `agentGuardrailsPrompt()`, ask context builders |

**Explicit non-goals (by design):** autonomous email send, unchecked calendar writes, embedding third-party agent marketplaces in the PWA (`AGENTS.md`).

---

## Peers surveyed

Products and projects compared to IRIS (voice + calendar + mail + ops), not generic ChatGPT wrappers.

| Product | Positioning | Notable differentiators vs IRIS |
|---------|-------------|----------------------------------|
| **Anuga.ai** | Multi-agent “company OS” | Long-running agents, CRM-ish workflows, heavy web app |
| **Nova** | Personal AI “everything” hub | Telegram/WhatsApp bots, plugins, broad tool sprawl |
| **Kaila OS** | Voice-first life OS | Persistent ambient voice, aggressive proactive nudges |
| **Orion** | SMS/voice personal agent | Twilio-native; text-in from anywhere |
| **OTTO** | Discord/community agent | Always-on in chat platforms |
| **OpenJarvis / Alfred** (this repo’s lineage) | Mac + scheduled briefings | Local always-on machine, Open Claw-style tools |
| **Atticus** (Mac) | Screen-aware wake word | OS-level context, menubar, live screen |
| **Herald OS** (ported patterns) | Fast local voice routing | `matchModuleFromSpeech`, intent bypass before `/api/ask` |
| **Microsoft Copilot / Google Gemini** | OS-integrated assistants | Deep calendar/mail **write**, meeting prep, cross-app actions |
| **Rewind / Limitless** | Timeline memory | Continuous capture, “what did I say last Tuesday” |

Competitors that are **poor fits to copy whole-cloth:** Nova-style plugin malls, AGPL media downloaders as in-app dependencies, replacing the HUD with one chat thread.

---

## Capability gaps worth adding

Grouped by **tier**: A = high leverage and fits PWA or thin sidecar; B = valuable, more build; C = low priority or high risk.

### Tier A — High fit (recommended “next 3”)

1. **Structured meeting prep pack**  
   - **Peer pattern:** Copilot/Gemini “prepare me for…” with agenda, attendees, talking points, open loops from mail/todos.  
   - **IRIS gap:** Next event title in morning briefing only; no prep object, no rehearsal mode.  
   - **Build sketch:** Before events (Plan/Today), generate a memo card (objective, 3 bullets, risks, Scribe draft if needed); optional 60s voice “rehearsal” with Iris feedback.  
   - **Fits:** Scribe + Navigator specialists; save to Hub memos; no new OAuth scope required initially.

2. **Calendar create / move / decline (gated)**  
   - **Peer pattern:** Voice “move my 3pm to 4” with confirmation.  
   - **IRIS gap:** `agentGuardrailsPrompt()` forbids calendar edits; read-only sync.  
   - **Build sketch:** New server tool `propose_calendar_change` → pending card in Today → single-tap confirm → Google Calendar API write; rate limit + audit log.  
   - **Fits:** Ledger specialist; preserves human-in-the-loop like Channels.

3. **SMS / iMessage morning digest & one-shot Q&A**  
   - **Peer pattern:** Orion-style “text Iris” when not in the PWA.  
   - **IRIS gap:** Push exists; no bidirectional SMS channel.  
   - **Build sketch:** Netlify handler + Twilio; signed account linking; digest cron mirrors `MorningBriefing` lines; inbound messages → capped `/api/ask` relay.  
   - **Fits:** Courier for digest; same daily turn caps.

4. **Inbox thread-level triage + suggested replies**  
   - **Peer pattern:** Superhuman/Shortwave AI stacks ranked by urgency with reply drafts.  
   - **IRIS gap:** Unread count + subjects; Courier summarizes but no per-thread state or one-tap draft queue.  
   - **Build sketch:** Extend Courier delegate with thread IDs; queue drafts in Channels; still **approve to send**.

5. **Promise / commitment ledger**  
   - **Peer pattern:** “You told X you’d send Y by Friday” from mail + voice.  
   - **IRIS gap:** Todos without “owed to whom / by when” semantics.  
   - **Build sketch:** `add_commitment` tool + Today filter; optional Scout verify.

6. **Adaptive morning briefing (rated / skipped sections)**  
   - **Peer pattern:** Briefings that learn what you care about (markets vs weather vs inbox).  
   - **IRIS gap:** Fixed line order in `MorningBriefing`.  
   - **Build sketch:** Lightweight prefs in user blob + “more/less like this” on briefing card.

7. **Health / wearable signals (read-only)**  
   - **Peer pattern:** Oura/Apple Health in morning vitals.  
   - **IRIS gap:** Fitness panel uses schedule/events; no wearable ingest.  
   - **Build sketch:** Apple Health export or Oura API → Vitals corner gauge; no diagnosis claims.

8. **Mac wake-word sidecar (Atticus-class)**  
   - **Peer pattern:** Always-on local wake without unlocking the PWA.  
   - **IRIS gap:** PWA voice when open; `docs/SERVER_PLAN.md` mentions Pipecat/Kokoro later.  
   - **Build sketch:** Thin Mac menu-bar client → authenticated `/api/ask` or local Herald fast-path; **not** full screen capture without explicit opt-in.

9. **Outbound voice calls (Twilio)**  
   - **Peer pattern:** “Call the school office and read this script” with human approval.  
   - **IRIS gap:** No telephony.  
   - **Build sketch:** Same approval pattern as channel-send; script preview; call log in ECS.

### Tier B — Valuable, higher complexity

| Capability | Why it matters | Notes for IRIS |
|------------|----------------|----------------|
| Live agent run control (pause/cancel/resume) | Long Scout jobs | Team module UI + job IDs in Blobs |
| Background job queue | Research, debrief uploads, n8n on future server | `docs/SERVER_PLAN.md` n8n phase |
| Email → todo mining | Peers auto-extract tasks from threads | Requires body access + privacy review |
| Multi-calendar attendee enrichment | “Who else is on this call?” | People graph lite in memos |
| Read-only Plaid / banking signal | Cash runway nudges | Money module; no spend tools |
| Social content pipeline | Postiz-style scheduling | Keep off PWA until server phase |
| Full God’s Eye globe | Peers’ “situation room” | Skill + Tailscale private host |
| Continuous timeline memory (Rewind-like) | Perfect recall | **High privacy risk**; likely sidecar-only |

### Tier C — Deprioritize or avoid

| Capability | Reason |
|------------|--------|
| Autonomous unreviewed email send | Violates channel + Family Purpose policy |
| Overnight autonomous inbox processing | Same trust model; legal/compliance |
| In-PWA skill marketplace (Voicebox, n8n UI) | `AGENTS.md` — links/docs only unless requested |
| Local LLM hosting in Netlify | Wrong runtime; server plan is separate |
| Replacing HUD with single chat | Loses ECS module map and specialist ownership |
| Weakening `safeFact` / student PII firewall | Non-negotiable for Family Purpose |

---

## What IRIS does **better** than most peers

- **Operational HUD** tuned to Eric’s domains (school calendar, leave-by, Bay Area Pulse, ECS, Woodhouse) — not a generic chat shell.  
- **Specialist map** with duplicate-work blocking — rare in consumer Jarvis apps.  
- **Draft-first outbound** and isolated Family Purpose channel.  
- **Server-enforced caps and memory safety** in one file (`agentGuardrails.ts`).  
- **Business Researcher** with daily limits and memos — deeper than most “personal” assistants.  
- **Flight track + pulse map** — concrete situational awareness competitors often omit.

---

## Recommended implementation sequence

If picking **three Tier A items** without further input (highest leverage for an executive + teacher schedule):

| Order | Item | Est. touch points |
|-------|------|-------------------|
| 1 | Meeting prep pack | `PlanPanel` / Today, Scribe, Hub memos, optional Iris tool |
| 2 | Gated calendar writes | New Netlify handler, Google Calendar API, Today approval UI |
| 3 | SMS digest + inbound Q&A | Twilio env, cron, `agentGuardrails` rate limits |

After each feature: extend `scripts/check-agent-guardrails.mts`, run `npm run test:os`.

---

## Antipatterns when borrowing from competitors

1. **Nova sprawl** — Do not duplicate every integration inside the PWA; use Woodhouse/server plan for heavy automation.  
2. **Copilot-style silent writes** — Always confirm calendar and send actions in UI.  
3. **Student data in model context** — Inbox bodies and names stay constrained per existing privacy rules.  
4. **AGPL media tooling in Netlify bundle** — Keep companions optional/cherry-picked.  
5. **Unbounded proactive agents** — Respect `ASK_DAILY_TURN_LIMIT` and research caps.

---

## References in this repo

- Agent policy: `AGENTS.md`, `shared/agentGuardrails.ts`  
- Modules & voice routing: `shared/hudModules.ts`  
- Team / delegates: `shared/irisTeam.ts`, `shared/irisTeamActivity.ts`  
- Future server capabilities: `docs/SERVER_PLAN.md`  
- Companion / sidecar direction: plan items (Pipecat, n8n, God's Eye skill)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-11 | Initial competitive survey and tiered gap list |
