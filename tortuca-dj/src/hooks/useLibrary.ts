import { useCallback, useEffect, useState } from 'react'
import {
  attachUpload,
  importFilesBatch,
  libraryStats,
  listTracks,
} from '../lib/library/db'
import type { ImportFileResult } from '../lib/library/db'
import type { LibraryTrack } from '../lib/library/types'

export function useLibrary() {
  const [tracks, setTracks] = useState<LibraryTrack[]>([])
  const [stats, setStats] = useState({
    total: 0,
    withAudio: 0,
    fromSpotify: 0,
    missing: 0,
  })
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [lastImportSummary, setLastImportSummary] = useState<string | null>(
    null,
  )

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

  const runImport = useCallback(
    async (files: FileList | File[]) => {
      setImporting(true)
      setLastImportSummary(null)
      try {
        const { results } = await importFilesBatch(files)
        const matched = results.filter((r) => r.status === 'matched').length
        const fresh = results.filter((r) => r.status === 'new').length
        setLastImportSummary(
          `Imported ${results.length} file(s): ${matched} matched catalog, ${fresh} new.`,
        )
        await refresh()
      } finally {
        setImporting(false)
      }
    },
    [refresh],
  )

  const attachFileToTrack = useCallback(
    async (trackId: string, file: File) => {
      await attachUpload(file, trackId)
      await refresh()
      setLastImportSummary(`Attached “${file.name}” to your library.`)
    },
    [refresh],
  )

  return {
    tracks,
    stats,
    loading,
    importing,
    lastImportSummary,
    refresh,
    importFiles: runImport,
    attachFileToTrack,
  }
}

export type { ImportFileResult }
