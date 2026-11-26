# Trustfund — MVP spec (doc only, season 3)

**Call sign:** Trustfund · **Engine:** PlayCanvas fork or `drive-world` feature flag · **Audience:** family boys on vantagegames1

## One-sentence pitch

Inherit **City Nights** driving + heat, add a **liquid wealth** meter and **consequence** sinks (spend flex vs cop heat), without a full life sim.

## Reuse from City Nights

| System | Reuse |
|--------|--------|
| Driving / regions | Same physics + minimap patterns |
| Heat / cops | `game-heat.ts`, chasers |
| Save | `game-progress` pattern, new `trustfund-*` ids |
| Console feel | Same HUD tab model |

## MVP scope (first code slice — not this sprint)

1. One district (Vallejo reskin or “Hills estate” bubble).
2. **Wealth meter** 0–100 + 3 sinks (garage flex, bail, party score).
3. One chapter: spend down without hitting heat 5.
4. No Tokyo, no new Netlify APIs.

## Out of scope

Multiplayer, stocks API, student PII, Alfred/Iris economy tools.

## Reference

[`2026-11-22-son-of-a-billionaire-inspiration.md`](./2026-11-22-son-of-a-billionaire-inspiration.md)