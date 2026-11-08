import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const STORE = 'city-nights-telemetry';

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

type Aggregate = { sessions: number; totalSec: number; lastClient?: string };

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }
  if (event.httpMethod !== 'POST' || !event.body || event.body.length > 4_000) {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  let body: { clientId?: string; sessionSec?: number };
  try {
    body = JSON.parse(event.body) as typeof body;
  } catch {
    return { statusCode: 400, headers: corsHeaders(), body: 'Invalid JSON' };
  }
  const clientId = body.clientId ?? '';
  if (!/^cn-tel-[0-9a-f-]{8,}$/i.test(clientId)) {
    return { statusCode: 400, headers: corsHeaders(), body: 'Invalid client id' };
  }
  const sec = Math.min(86_400, Math.max(0, Math.round(Number(body.sessionSec) || 0)));

  const day = new Date().toISOString().slice(0, 10);
  const store = getStore({ name: STORE, consistency: 'strong' });
  const key = `rollup/${day}.json`;
  const raw = await store.get(key, { type: 'text' });
  let agg: Aggregate = { sessions: 0, totalSec: 0 };
  if (raw) {
    try {
      agg = JSON.parse(raw) as Aggregate;
    } catch {
      /* */
    }
  }
  agg.sessions += 1;
  agg.totalSec += sec;
  agg.lastClient = clientId.slice(0, 12);
  await store.set(key, JSON.stringify(agg));

  return {
    statusCode: 200,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    body: '{"ok":true}'
  };
};
