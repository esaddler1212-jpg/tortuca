export type SearchProvider = 'youtube' | 'bandcamp' | 'discogs' | 'duckduckgo'

export function buildSearchUrl(
  provider: SearchProvider,
  artists: string,
  title: string,
): string {
  const q = encodeURIComponent(`${artists} ${title}`)
  switch (provider) {
    case 'youtube':
      return `https://www.youtube.com/results?search_query=${q}`
    case 'bandcamp':
      return `https://bandcamp.com/search?q=${q}`
    case 'discogs':
      return `https://www.discogs.com/search/?q=${q}&type=release`
    case 'duckduckgo':
      return `https://duckduckgo.com/?q=${q}+buy+mp3`
    default:
      return `https://duckduckgo.com/?q=${q}`
  }
}

export function openSearch(
  provider: SearchProvider,
  artists: string,
  title: string,
): void {
  window.open(buildSearchUrl(provider, artists, title), '_blank', 'noopener,noreferrer')
}
