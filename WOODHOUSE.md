# Woodhouse protocol

Woodhouse is the **backend connection layer** between apps you build and **Alfred**. Any app that exposes a Woodhouse snapshot can appear on Alfred’s dashboard without custom integration code.

## Roles

| Piece | Responsibility |
|--------|----------------|
| **Your app** | Implements `GET /api/woodhouse/snapshot` (read-only status). |
| **Alfred** | Registers app URLs, polls snapshots, merges briefing + schedule + actions. |

## Node contract (`woodhouse/node/v1`)

Each app returns JSON like:

```json
{
  "protocol": "woodhouse/node/v1",
  "nodeId": "easy-supply-co",
  "nodeType": "commerce",
  "displayName": "Easy Supply Co.",
  "generatedAt": "2026-07-29T12:00:00.000Z",
  "status": "ok",
  "summary": "2 orders need approval",
  "metrics": [
    { "key": "pending", "label": "Pending approvals", "value": 2, "alert": true }
  ],
  "calendar": [
    {
      "id": "evt-1",
      "kind": "meeting",
      "title": "Vendor call",
      "start": "2026-07-29T15:00:00.000Z",
      "detail": "Optional"
    }
  ],
  "priorityActions": ["Approve order #1042"],
  "links": [{ "label": "Open app", "url": "https://..." }]
}
```

### Fields

- **`nodeType`** — Freeform tag (`commerce`, `education`, `media`, `ops`, …). Alfred uses it for icons/grouping; unknown types still work.
- **`status`** — `ok` | `degraded` | `error` | `offline`
- **`summary`** — One line for Alfred’s daily briefing (required).
- **`metrics`** — Key figures; set `alert: true` when Alfred should emphasize them.
- **`calendar`** — Optional items for **today** (meetings, check-ins, deadlines).
- **`priorityActions`** — Strings merged across all nodes into Alfred’s action list.

### Legacy shapes

Alfred’s aggregator also accepts older payloads (e.g. Easy Supply `woodhouse/v1` store snapshot, Family Purpose education object) and normalizes them to `woodhouse/node/v1`.

## Orchestration (`woodhouse/v3`)

Alfred exposes:

`GET /api/woodhouse`

Response:

```json
{
  "protocol": "woodhouse/v3",
  "generatedAt": "...",
  "nodes": [
    {
      "registryId": "easy-supply-co",
      "displayName": "Easy Supply Co.",
      "nodeType": "commerce",
      "baseUrl": "https://...",
      "ok": true,
      "source": "live",
      "snapshot": { "...": "woodhouse/node/v1" }
    }
  ],
  "priorityActions": ["..."],
  "calendar": []
}
```

## Registering nodes

**Netlify (server):** `WOODHOUSE_NODES` JSON array:

```json
[
  {
    "id": "easy-supply-co",
    "displayName": "Easy Supply Co.",
    "nodeType": "commerce",
    "baseUrl": "https://easy-supply.example.netlify.app"
  },
  {
    "id": "family-purpose",
    "displayName": "Family Purpose",
    "nodeType": "education",
    "baseUrl": "https://family-purpose.example.netlify.app"
  }
]
```

Or legacy env vars: `WOODHOUSE_EASY_SUPPLY_URL`, `WOODHOUSE_FAMILY_PURPOSE_URL`, and `FAMILY_PURPOSE_BACKUP_KEY` (blob provider).

**Browser (Alfred Settings):** same registry stored in `localStorage`, sent as `X-Woodhouse-Registry` on each sync.

## Adding a new app

1. Add `GET /api/woodhouse/snapshot` to the app (return `woodhouse/node/v1`).
2. Deploy the app.
3. Register its base URL in Alfred Settings or `WOODHOUSE_NODES`.
4. Open Alfred — the node appears on the Woodhouse dashboard and in the daily briefing.

No changes to Alfred’s React code are required for standard nodes.

## Implementing in Node / Netlify

```ts
export const handler = async () => ({
  statusCode: 200,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    protocol: "woodhouse/node/v1",
    nodeId: "my-app",
    nodeType: "custom",
    displayName: "My App",
    generatedAt: new Date().toISOString(),
    status: "ok",
    summary: "All systems normal",
    metrics: [{ key: "users", label: "Active users", value: 42 }],
    priorityActions: [],
  }),
});
```

Mount at `/.netlify/functions/woodhouse-snapshot` with redirect `/api/woodhouse/snapshot` → that function.
