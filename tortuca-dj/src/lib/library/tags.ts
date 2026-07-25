import { parseBlob } from 'music-metadata'
import { normalizeMatchKey, parseFilename } from './match'

export interface FileIdentity {
  artists: string
  title: string
  album?: string
  matchKey: string
}

export async function getFileIdentity(file: File): Promise<FileIdentity> {
  try {
    const meta = await parseBlob(file, { skipCovers: true })
    const title = meta.common.title?.trim()
    const artists =
      meta.common.artists?.join(', ') ||
      meta.common.artist?.trim() ||
      meta.common.albumartist?.trim()
    if (title && artists) {
      return {
        artists,
        title,
        album: meta.common.album,
        matchKey: normalizeMatchKey(artists, title),
      }
    }
  } catch {
    /* fall through to filename */
  }

  const parsed = parseFilename(file.name)
  if (parsed) {
    return {
      artists: parsed.artists,
      title: parsed.title,
      matchKey: normalizeMatchKey(parsed.artists, parsed.title),
    }
  }

  const title = file.name.replace(/\.[^.]+$/, '')
  return {
    artists: 'Unknown artist',
    title,
    matchKey: normalizeMatchKey('Unknown artist', title),
  }
}
