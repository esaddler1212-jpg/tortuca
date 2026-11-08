const JOKE_URL = 'https://v2.jokeapi.dev/joke/Programming?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&format=safe&type=single';

const OPEN5E_SPELL = 'https://api.open5e.com/spells/?limit=1';

let cachedTip = 'Boost into the skyline — Shift';

export function currentLoadingTip(): string {
  return cachedTip;
}

export async function refreshLoadingTips(): Promise<void> {
  const parts: string[] = [];
  await Promise.all([
    (async () => {
      try {
        const res = await fetch(JOKE_URL);
        if (!res.ok) return;
        const j = (await res.json()) as { joke?: string };
        if (j.joke) parts.push(j.joke.slice(0, 120));
      } catch {
        /* offline */
      }
    })(),
    (async () => {
      try {
        const page = 1 + Math.floor(Math.random() * 300);
        const res = await fetch(`${OPEN5E_SPELL}&page=${page}`);
        if (!res.ok) return;
        const j = (await res.json()) as { results?: { name: string }[] };
        const name = j.results?.[0]?.name;
        if (name) parts.push(`Super meter: ${name} (SRD homage)`);
      } catch {
        /* offline */
      }
    })()
  ]);
  if (parts.length) cachedTip = parts.join(' · ');
}
