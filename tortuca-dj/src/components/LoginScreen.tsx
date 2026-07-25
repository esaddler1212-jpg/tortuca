import { Disc3, LogOut, Music2 } from 'lucide-react'
import { beginLogin, logout } from '../lib/spotify/auth'
import { getClientId } from '../lib/spotify/config'

interface LoginScreenProps {
  authError: string | null
}

export function LoginScreen({ authError }: LoginScreenProps) {
  const hasClientId = Boolean(getClientId())

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-emerald-950/20">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Disc3 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tortuca DJ</h1>
            <p className="text-sm text-zinc-400">Mix from your Spotify playlists</p>
          </div>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-zinc-400">
          Load any playlist, cue tracks on two decks, preview in your headphones,
          and crossfade into the next song. Requires Spotify Premium for full-length
          playback in the browser.
        </p>

        {!hasClientId && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Add your Spotify app Client ID to <code className="font-mono text-xs">.env</code>{' '}
            as <code className="font-mono text-xs">VITE_SPOTIFY_CLIENT_ID</code>, and set
            redirect URI <code className="font-mono text-xs">http://localhost:5173/callback</code>{' '}
            in the Spotify Developer Dashboard.
          </div>
        )}

        {authError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {authError}
          </div>
        )}

        <button
          type="button"
          disabled={!hasClientId}
          onClick={() => void beginLogin()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-4 py-3 font-semibold text-black transition hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Music2 className="h-5 w-5" />
          Connect Spotify
        </button>
      </div>
    </div>
  )
}

interface HeaderProps {
  userName: string | null
}

export function Header({ userName }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 md:px-6">
      <div className="flex items-center gap-2">
        <Disc3 className="h-6 w-6 text-emerald-400" />
        <span className="font-semibold tracking-tight">Tortuca DJ</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        {userName && <span>Hi, {userName}</span>}
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </header>
  )
}
