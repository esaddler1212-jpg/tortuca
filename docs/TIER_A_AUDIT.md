# Tier A security audit — remediations

All findings from the Nov 2026 Tier A audit are addressed on `main` via follow-up PR.

| Finding | Fix |
|---------|-----|
| Voice TwiML URL leaked blob key + call id | One-time `token` nonce in blob store `iris-voice-twiml`; `consumeVoiceTwimlNonce` on fetch; optional Twilio signature on POST |
| Weak SMS LINK codes | 16 hex chars, 1h TTL (`linkCodeExpiresAt`), cleared after link; 12 failed LINKs/day per phone |
| SMS thin context | `shared/tierASmsContext.ts` + Gmail metadata when session live; school withhold via `inboxContext` |
| SMS usage key split | Usage keyed by `acct:email` when indexed, else account blob key |
| `listAllUserData` every SMS | Phone → `acct` index blob `iris-sms-phone-index` after link |
| Triage “Queue reply” noop | `POST /api/inbox-triage-draft` → `createScribeDraft` |
| Static audits gap | `test:iris` Tier A tools; `test:guardrails` calendar/voice/sms checks |
| `test:os` flight-nemulator | `npm ci` in `flight-nemulator/` when `playcanvas` missing |

Ops reference: `docs/TIER_A_OPS.md`.
