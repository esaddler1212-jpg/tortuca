import type { Handler, HandlerEvent } from '@netlify/functions';
import { createHash } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const STORE = 'battleworld-lattice-v1';
const MIN_WRITE_GAP_MS = 18_000;
const TOKEN_RE = /^bw-[0-9a-f-]{16,}$/i;

export type LatticeSession = { email?: string } | null;

export type LatticeHandlerDeps = {
  initBlobs?: (event: HandlerEvent) => void;
  loadSession: (event: HandlerEvent) => Promise<LatticeSession>;
  requireSession: boolean;
};

function cors(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Alfred-Session',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}

function tokenFrom(event: HandlerEvent): string | null {
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

function accountKey(session: LatticeSession, sessionId: string | null): string | null {
  if (!session && !sessionId) return null;
  const basis = session?.email?.toLowerCase().trim() || sessionId || '';
  if (!basis) return null;
  return createHash('sha256').update(basis).digest('hex').slice(0, 40);
}

function storagePrefix(
  session: LatticeSession,
  sessionId: string | null,
  token: string,
  requireSession: boolean
): { prefix: string } | { error: string; status: number } {
  const acct = accountKey(session, sessionId);
  if (acct) return { prefix: `acct/${acct}` };
  if (requireSession) {
    return { error: 'Connect Google for Battleworld cloud save.', status: 401 };
  }
  return { prefix: `token/${token}` };
}

export function createBattleworldLatticeHandler(deps: LatticeHandlerDeps): Handler {
  return async (event) => {
    deps.initBlobs?.(event);

    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: cors(), body: '' };
    }

    const token = tokenFrom(event);
    if (!token) {
      return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'invalid token' }) };
    }

    const sessionId =
      event.headers['x-alfred-session'] ?? event.headers['X-Alfred-Session'] ?? null;
    const session = await deps.loadSession(event);
    if (deps.requireSession && !session) {
      return {
        statusCode: 401,
        headers: { ...cors(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Connect Google for Battleworld cloud save.' })
      };
    }

    const resolved = storagePrefix(session, sessionId, token, deps.requireSession);
    if ('error' in resolved) {
      return {
        statusCode: resolved.status,
        headers: { ...cors(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: resolved.error })
      };
    }

    const store = getStore({ name: STORE, consistency: 'strong' });
    const heroId =
      event.httpMethod === 'GET'
        ? String(event.queryStringParameters?.heroId ?? 'solar-apex').slice(0, 48)
        : (JSON.parse(event.body ?? '{}') as { heroId?: string }).heroId?.slice(0, 48) ??
          'solar-apex';
    const blobKey = `lattice/${resolved.prefix}/${heroId}.json`;
    const metaKey = `meta/${resolved.prefix}/${heroId}.json`;

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
      let body: { heroId?: string; lattice?: number; beats?: string[] };
      try {
        body = JSON.parse(event.body ?? '{}') as { heroId?: string; lattice?: number; beats?: string[] };
      } catch {
        return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'invalid json' }) };
      }
      const payload = {
        heroId,
        lattice: Math.min(999, Math.max(0, Number(body.lattice) || 0)),
        beats: Array.isArray(body.beats) ? body.beats.slice(0, 24) : [],
        updatedAt: new Date().toISOString(),
        scope: resolved.prefix.startsWith('acct/') ? 'account' : 'anon'
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
}
