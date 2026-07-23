import { NextResponse } from 'next/server'
import { isGoogleConfigured, buildAuthUrl, GOOGLE_STATE_COOKIE } from '@/lib/google'

export async function GET(request: Request) {
  const base = new URL(request.url).origin

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(`${base}/?google=unconfigured`)
  }

  const state = crypto.randomUUID()
  const res = NextResponse.redirect(buildAuthUrl(state))
  res.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
