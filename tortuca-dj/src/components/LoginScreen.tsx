import { Disc3, LogOut } from 'lucide-react'
import { beginLogin, logout } from '../lib/spotify/auth'
import { getClientId } from '../lib/spotify/config'

interface HeaderProps {
  userName: string | null
  spotifyConnected: boolean
}

export function Header({ userName, spotifyConnected }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 md:px-6">
      <div className="flex items-center gap-2">
        <Disc3 className="h-6 w-6 text-emerald-400" />
        <div>
          <span className="font-semibold tracking-tight">Tortuca DJ</span>
          <span className="ml-2 hidden text-xs text-zinc-500 sm:inline">
            Private library
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        {spotifyConnected && userName && (
          <span className="hidden sm:inline">Spotify: {userName}</span>
        )}
        {spotifyConnected ? (
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            disabled={!getClientId()}
            onClick={() => void beginLogin()}
            className="rounded-lg border border-[#1DB954]/40 px-3 py-1.5 text-[#1ed760] hover:bg-[#1DB954]/10 disabled:opacity-40"
          >
            Connect Spotify
          </button>
        )}
      </div>
    </header>
  )
}

interface WelcomeBannerProps {
  authError: string | null
}

export function WelcomeBanner({ authError }: WelcomeBannerProps) {
  if (!authError) return null
  return (
    <div className="bg-red-950/50 px-4 py-2 text-center text-sm text-red-200">
      {authError}
    </div>
  )
}
