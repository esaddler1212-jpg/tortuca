import { useCallback, useEffect, useRef, useState } from 'react'
import { getValidAccessToken } from '../lib/spotify/auth'
import {
  playTrackUri,
  setPlaybackVolume,
  transferPlaybackToDevice,
} from '../lib/spotify/api'
import { loadSpotifySdk } from '../lib/spotify/sdk'
import type { PlaybackState, SpotifyPlayerInstance } from '../lib/spotify/types'

export interface PlayerStatus {
  ready: boolean
  deviceId: string | null
  error: string | null
  state: PlaybackState | null
}

export function useSpotifyPlayer() {
  const playerRef = useRef<SpotifyPlayerInstance | null>(null)
  const [status, setStatus] = useState<PlayerStatus>({
    ready: false,
    deviceId: null,
    error: null,
    state: null,
  })

  useEffect(() => {
    let cancelled = false
    let player: SpotifyPlayerInstance | null = null

    async function init() {
      const token = await getValidAccessToken()
      if (!token || cancelled) return

      try {
        await loadSpotifySdk()
        if (cancelled) return

        player = new window.Spotify.Player({
          name: 'Tortuca DJ',
          getOAuthToken: (cb) => {
            void getValidAccessToken().then((t) => {
              if (t) cb(t)
            })
          },
          volume: 0.8,
        })
        playerRef.current = player

        player.addListener('ready', (state) => {
          const { device_id } = state as { device_id: string }
          if (cancelled) return
          setStatus((s) => ({
            ...s,
            ready: true,
            deviceId: device_id,
            error: null,
          }))
        })

        player.addListener('not_ready', (state) => {
          const { device_id } = state as { device_id: string }
          setStatus((s) => ({ ...s, ready: false, deviceId: device_id }))
        })

        player.addListener('initialization_error', (state) => {
          const { message } = state as { message: string }
          setStatus((s) => ({ ...s, error: message }))
        })

        player.addListener('authentication_error', (state) => {
          const { message } = state as { message: string }
          setStatus((s) => ({ ...s, error: message }))
        })

        player.addListener('account_error', (state) => {
          const { message } = state as { message: string }
          setStatus((s) => ({
            ...s,
            error: `${message} (Spotify Premium required)`,
          }))
        })

        player.addListener('player_state_changed', (state) => {
          setStatus((s) => ({
            ...s,
            state: state as PlaybackState | null,
          }))
        })

        const connected = await player.connect()
        if (!connected && !cancelled) {
          setStatus((s) => ({
            ...s,
            error: 'Could not connect to Spotify player',
          }))
        }
      } catch (e) {
        if (!cancelled) {
          setStatus((s) => ({
            ...s,
            error: e instanceof Error ? e.message : 'Player init failed',
          }))
        }
      }
    }

    void init()

    return () => {
      cancelled = true
      player?.disconnect()
      playerRef.current = null
    }
  }, [])

  const playUri = useCallback(
    async (uri: string, positionMs = 0) => {
      const deviceId = status.deviceId
      if (!deviceId) return
      await transferPlaybackToDevice(deviceId)
      await playTrackUri(deviceId, uri, positionMs)
    },
    [status.deviceId],
  )

  const setVolume = useCallback(
    async (volume: number) => {
      const deviceId = status.deviceId
      if (!deviceId) return
      await setPlaybackVolume(deviceId, volume * 100)
      await playerRef.current?.setVolume(volume)
    },
    [status.deviceId],
  )

  const pause = useCallback(async () => {
    await playerRef.current?.pause()
  }, [])

  const resume = useCallback(async () => {
    await playerRef.current?.resume()
  }, [])

  const seek = useCallback(async (ms: number) => {
    await playerRef.current?.seek(ms)
  }, [])

  return {
    status,
    playUri,
    setVolume,
    pause,
    resume,
    seek,
    player: playerRef,
  }
}
