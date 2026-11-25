const KEY = 'flight-nemulator-invite-shard';

export type InviteShard = {
  shardId: string;
  heroId?: string;
  wave?: number;
  label: string;
};

function parseParams(): InviteShard | null {
  if (typeof location === 'undefined') return null;
  const p = new URLSearchParams(location.search);
  const shard = p.get('bwShard')?.trim();
  if (!shard || shard.length < 4) return null;
  const heroId = p.get('hero')?.trim() || undefined;
  const waveRaw = p.get('wave');
  const wave = waveRaw ? Number.parseInt(waveRaw, 10) : undefined;
  return {
    shardId: shard.slice(0, 48),
    heroId,
    wave: Number.isFinite(wave) ? wave : undefined,
    label: `Shard ${shard.slice(0, 8)} — fly the same lattice run`
  };
}

/** Mythwild-style invite link state (`?bwShard=&hero=&wave=`). */
export function consumeInviteShardFromUrl(): InviteShard | null {
  const parsed = parseParams();
  if (!parsed) return null;
  try {
    localStorage.setItem(KEY, JSON.stringify(parsed));
  } catch {
    /* */
  }
  if (typeof history !== 'undefined' && history.replaceState) {
    const url = new URL(location.href);
    url.searchParams.delete('bwShard');
    url.searchParams.delete('hero');
    url.searchParams.delete('wave');
    history.replaceState({}, '', url.pathname + url.search + url.hash);
  }
  return parsed;
}

export function loadInviteShard(): InviteShard | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InviteShard;
  } catch {
    return null;
  }
}

export function inviteShareUrl(shardId: string, heroId: string, wave: number): string {
  const base =
    typeof location !== 'undefined' ? location.href : 'https://battleworld.local/play';
  const url = new URL(base);
  url.searchParams.set('bwShard', shardId);
  url.searchParams.set('hero', heroId);
  url.searchParams.set('wave', String(wave));
  return url.toString();
}