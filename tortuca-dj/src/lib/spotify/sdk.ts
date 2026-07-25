const SDK_URL = 'https://sdk.scdn.co/spotify-player.js'

let loadPromise: Promise<void> | null = null

export function loadSpotifySdk(): Promise<void> {
  if (window.Spotify?.Player) return Promise.resolve()
  if (loadPromise) return loadPromise
  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${SDK_URL}"]`,
    ) as HTMLScriptElement | null
    if (existing) {
      window.onSpotifyWebPlaybackSDKReady = () => resolve()
      return
    }
    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.onerror = () => reject(new Error('Failed to load Spotify SDK'))
    window.onSpotifyWebPlaybackSDKReady = () => resolve()
    document.body.appendChild(script)
  })
  return loadPromise
}
