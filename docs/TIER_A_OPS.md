# Tier A executive ops (implemented)

All nine Tier A items from competitive research are wired as follows.

| Capability | How it works |
|------------|----------------|
| Meeting prep | Iris `prepare_meeting` → `tierA.meetingPreps` → Today **Tier A ops** card |
| Calendar writes | Iris `propose_calendar_change` → confirm **Apply** → `POST /api/calendar-apply` (requires `calendar.events` scope — reconnect Google once) |
| SMS digest + Q&A | `POST /api/sms-link`, cron `sms-digest-scheduled`, webhook `twilio-inbound` — set `TWILIO_*` env |
| Inbox triage | `POST /api/inbox-triage` + Courier context; school threads skipped |
| Commitments | Iris `add_commitment` → ledger on Today |
| Adaptive briefing | `briefingPrefs` weights in `MorningBriefing` + +/- chips in Tier A panel |
| Wearables | `POST /api/wearable-ingest` or manual log in Tier A panel |
| Mac sidecar | `companions/iris-sidecar/` scaffold + `ask-once.sh` |
| Voice calls | Iris `propose_voice_call` → **Place call** → `POST /api/voice-call` + `twilio-voice-twiml` |

**Blob field:** `AlfredUserData.tierA` (`shared/tierAOps.ts`).

**Netlify env (optional):** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`, `TWILIO_VOICE_FROM`.

**Security (post-audit):** Voice TwiML uses one-time tokens only. SMS link codes expire in 1 hour. See `docs/TIER_A_AUDIT.md`.
