import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const STORE = 'city-nights-saves';
const MIN_WRITE_GAP_MS = 22_000;

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-City-Nights-Sync',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}

function syncKey(event: Parameters<Handler>[0]): string | null {
  const h = event.headers['x-city-nights-sync'] ?? event.headers['X-City-Nights-Sync'];
  if (h && /^cn-[0-9a-f-]{20,}$/i.test(h)) return h;
  return null;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  const key = syncKey(event);
  if (!key) {
    return { statusCode: 400, headers: corsHeaders(), body: 'Missing or invalid X-City-Nights-Sync header' };
  }

  const store = getStore({ name: STORE, consistency: 'strong' });
  const blobKey = `progress/${key}.json`;
  const metaKey = `meta/${key}.json`;

  if (event.httpMethod === 'GET') {
    const data = await store.get(blobKey, { type: 'text' });
    if (!data) {
      return { statusCode: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: '{}' };
    }
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: JSON.parse(data) })
    };
  }

  if (event.httpMethod === 'POST') {
    if (!event.body || event.body.length > 120_000) {
      return { statusCode: 413, headers: corsHeaders(), body: 'Payload too large' };
    }
    const metaRaw = await store.get(metaKey, { type: 'text' });
    if (metaRaw) {
      try {
        const meta = JSON.parse(metaRaw) as { lastWriteMs?: number };
        if (meta.lastWriteMs && Date.now() - meta.lastWriteMs < MIN_WRITE_GAP_MS) {
          return {
            statusCode: 429,
            headers: { ...corsHeaders(), 'Retry-After': '25', 'Content-Type': 'application/json' },
            body: JSON.stringify({ ok: false, reason: 'throttled' })
          };
        }
      } catch {
        /* */
      }
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(event.body) as { progress?: unknown };
    } catch {
      return { statusCode: 400, headers: corsHeaders(), body: 'Invalid JSON' };
    }
    const progress = (parsed as { progress?: unknown }).progress;
    if (!progress || typeof progress !== 'object') {
      return { statusCode: 400, headers: corsHeaders(), body: 'Missing progress object' };
    }
    await store.set(blobKey, JSON.stringify(progress));
    await store.set(metaKey, JSON.stringify({ lastWriteMs: Date.now() }));
    return { statusCode: 200, headers: corsHeaders(), body: '{"ok":true}' };
  }

  return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
};
