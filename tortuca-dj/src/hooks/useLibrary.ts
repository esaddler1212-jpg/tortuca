import { useCallback, useEffect, useState } from 'react'
import {
  attachUpload,
  findBestMatchForFile,
  libraryStats,
  listTracks,
} from '../lib/library/db'
import type { LibraryTrack } from '../lib/library/types'

export function useLibrary() {
  const [tracks, setTracks] = useState<LibraryTrack[]>([])
  const [stats, setStats] = useState({
    total: 0,
    withAudio: 0,
    fromSpotify: 0,
  })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [list, s] = await Promise.all([listTracks(), libraryStats()])
      setTracks(list)
      setStats(s)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const importFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files).filter((f) =>
        /\.(mp3|wav|flac|ogg|m4a|aac)$/i.test(f.name),
      )
      const current = await listTracks()
      for (const file of fileArr) {
        const match = await findBestMatchForFile(file, current)
        await attachUpload(file, match?.track.id)
      }
      await refresh()
    },
    [refresh],
  )

  return { tracks, stats, loading, refresh, importFiles }
}
