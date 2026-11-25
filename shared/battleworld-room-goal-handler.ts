import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const STORE = 'battleworld-room-goal-v1';
const DEFAULT_TARGET = 120;

function cors(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Alfred-Session',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}

function weekKey(weekId: string): string {
  const w = weekId.replace(/[^0-9A-Za-z-]/g, '').slice(0, 16);
  return w || 'unknown';
}

export function createBattleworldRoomGoalHandler(): Handler {
  return async (event) => {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: cors(), body: '' };
    }

    const store = getStore({ name: STORE, consistency: 'strong' });

    if (event.httpMethod === 'GET') {
      const weekId = weekKey(String(event.queryStringParameters?.weekId ?? ''));
      const raw = await store.get(`goal/${weekId}`, { type: 'text' });
      const tally = raw ? Number.parseInt(raw, 10) : 0;
      return {
        statusCode: 200,
        headers: { ...cors(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekId,
          tally: Number.isFinite(tally) ? tally : 0,
          target: DEFAULT_TARGET
        })
      };
    }

    if (event.httpMethod === 'POST') {
      let body: { weekId?: string; delta?: number };
      try {
        body = JSON.parse(event.body ?? '{}') as { weekId?: string; delta?: number };
      } catch {
        return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'invalid json' }) };
      }
      const weekId = weekKey(String(body.weekId ?? ''));
      const delta = Math.min(5, Math.max(0, Number(body.delta) || 0));
      if (!weekId || delta < 1) {
        return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'bad payload' }) };
      }
      const key = `goal/${weekId}`;
      const raw = await store.get(key, { type: 'text' });
      const prev = raw ? Number.parseInt(raw, 10) : 0;
      const next = (Number.isFinite(prev) ? prev : 0) + delta;
      await store.set(key, String(next));
      return {
        statusCode: 200,
        headers: { ...cors(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, tally: next, target: DEFAULT_TARGET })
      };
    }

    return { statusCode: 405, headers: cors(), body: '' };
  };
}