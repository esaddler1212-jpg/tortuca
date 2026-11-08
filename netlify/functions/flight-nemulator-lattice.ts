import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const STORE = 'battleworld-lattice-v1';
const MIN_WRITE_GAP_MS = 18_000;
const TOKEN_RE = /^bw-[0-9a-f-]{16,}$/i;

function cors(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}

function tokenFrom(event: Parameters<Handler>[0]): string | null {
  if (event.httpMethod === 'GET') {
    const q = event.queryStringParameters?.token;
    return q && TOKEN_RE.test(q) ? q : null;
  }
  try {
    const body = JSON.parse(event.body ?? '{}') as { token?: string };
    return body.token && TOKEN_RE.test(body.token) ? body.token : null;
  } catch {
    return null;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }
  const token = tokenFrom(event);
  if (!token) {
    return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'invalid token' }) };
  }

  const store = getStore({ name: STORE, consistency: 'strong' });
  const heroId =
    event.httpMethod === 'GET'
      ? String(event.queryStringParameters?.heroId ?? 'solar-apex').slice(0, 48)
      : (JSON.parse(event.body ?? '{}') as { heroId?: string }).heroId?.slice(0, 48) ?? 'solar-apex';
  const blobKey = `lattice/${token}/${heroId}.json`;
  const metaKey = `meta/${token}/${heroId}.json`;

  if (event.httpMethod === 'GET') {
    const raw = await store.get(blobKey, { type: 'text' });
    if (!raw) {
      return { statusCode: 200, headers: { ...cors(), 'Content-Type': 'application/json' }, body: '{}' };
    }
    return {
      statusCode: 200,
      headers: { ...cors(), 'Content-Type': 'application/json' },
      body: raw
    };
  }

  if (event.httpMethod === 'POST') {
    const metaRaw = await store.get(metaKey, { type: 'text' });
    if (metaRaw) {
      try {
        const meta = JSON.parse(metaRaw) as { lastWriteMs?: number };
        if (meta.lastWriteMs && Date.now() - meta.lastWriteMs < MIN_WRITE_GAP_MS) {
          return {
            statusCode: 429,
            headers: { ...cors(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ ok: false, reason: 'throttled' })
          };
        }
      } catch {
        /* */
      }
    }
    const body = JSON.parse(event.body ?? '{}') as {
      heroId?: string;
      lattice?: number;
      beats?: string[];
    };
    const payload = {
      heroId,
      lattice: Math.min(999, Math.max(0, Number(body.lattice) || 0)),
      beats: Array.isArray(body.beats) ? body.beats.slice(0, 24) : [],
      updatedAt: new Date().toISOString()
    };
    await store.set(blobKey, JSON.stringify(payload));
    await store.set(metaKey, JSON.stringify({ lastWriteMs: Date.now() }));
    return {
      statusCode: 200,
      headers: { ...cors(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };
  }

  return { statusCode: 405, headers: cors(), body: '' };
};
