import type { HandlerEvent } from '@netlify/functions';
import { createBattleworldLatticeHandler } from '../../../shared/battleworld-lattice-handler';

/** Standalone Battleworld deploy — anonymous token sync (no Google session). */
export const handler = createBattleworldLatticeHandler({
  loadSession: async (_event: HandlerEvent) => null,
  requireSession: false
});
