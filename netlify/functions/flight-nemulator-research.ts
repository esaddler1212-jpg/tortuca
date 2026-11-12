import type { Handler } from '@netlify/functions';

type Draft = {
  codename: string;
  tagline: string;
  suggestedDistrictId: string;
  powers: string[];
};

const HOMAGE_DRAFTS: Draft[] = [
  {
    codename: 'Star Sentinel',
    tagline: 'Cosmic shield diver',
    suggestedDistrictId: 'watchtower-annex',
    powers: ['beam', 'telekinesis']
  },
  {
    codename: 'Circuit Ghost',
    tagline: 'Hologram flanker',
    suggestedDistrictId: 'stark-nexus',
    powers: ['repulsor', 'synth']
  },
  {
    codename: 'Mist Acrobat',
    tagline: 'Fog-step infiltrator',
    suggestedDistrictId: 'gotham-nights',
    powers: ['web']
  },
  {
    codename: 'Frost Monarch',
    tagline: 'Diamond queen hover',
    suggestedDistrictId: 'watchtower-annex',
    powers: ['telekinesis', 'beam']
  },
  {
    codename: 'Cable Echo',
    tagline: 'TK field soldier',
    suggestedDistrictId: 'sokovia-memorial',
    powers: ['beam', 'telekinesis']
  }
];

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'POST only' }) };
  }
  let theme = '';
  try {
    const body = JSON.parse(event.body ?? '{}') as { theme?: string };
    theme = String(body.theme ?? '').slice(0, 120);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const drafts =
    theme.length > 0
      ? HOMAGE_DRAFTS.filter(
          (d) =>
            d.codename.toLowerCase().includes(theme.toLowerCase()) ||
            d.tagline.toLowerCase().includes(theme.toLowerCase())
        )
      : HOMAGE_DRAFTS;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drafts: drafts.length ? drafts : HOMAGE_DRAFTS })
  };
};
