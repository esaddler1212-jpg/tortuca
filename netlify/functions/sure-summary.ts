import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";

type SureAccount = {
  balance?: string | number | null;
  current_balance?: string | number | null;
  name?: string;
};

function parseAmount(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  initBlobs(event);
  const sessionId = sessionHeader(event);
  const session = sessionId ? await getValidSession(sessionId) : null;
  if (!sessionId || !session) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Connect Google first.", configured: false, dataSource: "unconfigured" }),
    };
  }

  const base = process.env.SURE_API_URL?.trim().replace(/\/$/, "");
  const apiKey = process.env.SURE_API_KEY?.trim();
  if (!base || !apiKey) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "X-Sure-Source": "unconfigured" },
      body: JSON.stringify({
        configured: false,
        dataSource: "unconfigured",
        fetchedAt: new Date().toISOString(),
      }),
    };
  }

  try {
    const res = await fetch(`${base}/api/v1/accounts?per_page=100`, {
      headers: { Accept: "application/json", "X-Api-Key": apiKey },
    });
    if (!res.ok) {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json", "X-Sure-Source": "error" },
        body: JSON.stringify({
          configured: true,
          dataSource: "error",
          error: `Sure API ${res.status}`,
          fetchedAt: new Date().toISOString(),
        }),
      };
    }
    const data = (await res.json()) as { accounts?: SureAccount[]; data?: SureAccount[] };
    const accounts = data.accounts ?? data.data ?? [];
    let assetsTotal = 0;
    let counted = 0;
    for (const a of accounts) {
      const amt = parseAmount(a.balance) ?? parseAmount(a.current_balance);
      if (amt != null) {
        assetsTotal += amt;
        counted++;
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "X-Sure-Source": "sure" },
      body: JSON.stringify({
        configured: true,
        dataSource: "sure",
        fetchedAt: new Date().toISOString(),
        accountCount: accounts.length,
        assetsTotal: counted > 0 ? assetsTotal : undefined,
      }),
    };
  } catch {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json", "X-Sure-Source": "error" },
      body: JSON.stringify({
        configured: true,
        dataSource: "error",
        error: "Sure unreachable from Netlify",
        fetchedAt: new Date().toISOString(),
      }),
    };
  }
};