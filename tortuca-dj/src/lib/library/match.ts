export function normalizeMatchKey(artists: string, title: string): string {
  return `${artists} ${title}`
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Parse common filename patterns: "Artist - Title.mp3" */
export function parseFilename(filename: string): {
  artists: string
  title: string
} | null {
  const base = filename.replace(/\.[^.]+$/, '').trim()
  const sep = base.match(/\s[-–—]\s/)
  if (!sep || sep.index == null) return null
  const artists = base.slice(0, sep.index).trim()
  const title = base.slice(sep.index + sep[0].length).trim()
  if (!artists || !title) return null
  return { artists, title }
}

export function scoreMatch(
  fileKey: string,
  trackKey: string,
): number {
  if (fileKey === trackKey) return 1
  if (fileKey.includes(trackKey) || trackKey.includes(fileKey)) return 0.85
  const fileTokens = new Set(fileKey.split(' ').filter(Boolean))
  const trackTokens = trackKey.split(' ').filter(Boolean)
  if (trackTokens.length === 0) return 0
  let hits = 0
  for (const t of trackTokens) {
    if (fileTokens.has(t)) hits++
  }
  return hits / trackTokens.length
}
