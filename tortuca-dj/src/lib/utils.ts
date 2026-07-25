import type { DeckTrack } from '../lib/spotify/types'

export function trackImage(
  track: DeckTrack | null,
  size: 'small' | 'large' = 'large',
): string | null {
  if (!track?.album?.images?.length) return null
  const images = track.album.images
  if (size === 'small') return images[images.length - 1]?.url ?? images[0]?.url
  return images[0]?.url ?? null
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function artistNames(track: DeckTrack | null): string {
  if (!track) return ''
  return track.artists.map((a) => a.name).join(', ')
}

export async function runCrossfade(
  fromVolume: number,
  toVolume: number,
  durationMs: number,
  onStep: (volume: number) => void,
): Promise<void> {
  const start = performance.now()
  return new Promise((resolve) => {
    function frame(now: number) {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = t * t * (3 - 2 * t)
      const v = fromVolume + (toVolume - fromVolume) * eased
      onStep(v)
      if (t < 1) requestAnimationFrame(frame)
      else resolve()
    }
    requestAnimationFrame(frame)
  })
}
