import type { HandlerEvent } from '@netlify/functions';
import { createBattleworldLatticeHandler } from '../../shared/battleworld-lattice-handler';
import { getValidSession, initBlobs, sessionHeader } from './_shared';

/** Production: 401 Unauthorized — Connect Google for Battleworld cloud save. */

function latticeRequireSession(): boolean {
  const v = process.env.BATTLEWORLD_LATTICE_REQUIRE_SESSION?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

async function loadSession(event: HandlerEvent) {
  const sessionId = sessionHeader(event);
  if (!sessionId) return null;
  const session = await getValidSession(sessionId);
  if (!session) return null;
  return { email: session.email };
}

export const handler = createBattleworldLatticeHandler({
  initBlobs,
  loadSession,
  requireSession: latticeRequireSession()
});
