import { useCallback, useEffect, useState } from 'react'
import {
  getValidAccessToken,
  handleAuthCallback,
  loadTokens,
} from '../lib/spotify/auth'
import { getCurrentUser } from '../lib/spotify/api'

export function useSpotifyAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    const token = await getValidAccessToken()
    setAccessToken(token)
    if (token) {
      try {
        const user = await getCurrentUser()
        setUserName(user.display_name)
      } catch {
        setUserName(null)
      }
    } else {
      setUserName(null)
    }
  }, [])

  useEffect(() => {
    async function run() {
      setLoading(true)
      setAuthError(null)

      if (window.location.pathname === '/callback') {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const error = params.get('error')
        if (error) {
          setAuthError(error)
          window.history.replaceState({}, '', '/')
        } else if (code) {
          try {
            await handleAuthCallback(code)
            window.history.replaceState({}, '', '/')
          } catch (e) {
            setAuthError(
              e instanceof Error ? e.message : 'Authentication failed',
            )
            window.history.replaceState({}, '', '/')
          }
        }
      }

      await refreshSession()
      setLoading(false)
    }
    void run()
  }, [refreshSession])

  const isLoggedIn = Boolean(accessToken) || Boolean(loadTokens())

  return {
    loading,
    isLoggedIn,
    userName,
    authError,
    refreshSession,
  }
}
