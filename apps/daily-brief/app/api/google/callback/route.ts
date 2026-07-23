import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  exchangeCode,
  GOOGLE_COOKIE,
  GOOGLE_STATE_COOKIE,
} from '@/lib/google'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const base = url.origin
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const expectedState = cookies().get(GOOGLE_STATE_COOKIE)?.value

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${base}/?google=error`)
  }

  const tokens = await exchangeCode(code)
  if (!tokens) {
    return NextResponse.redirect(`${base}/?google=error`)
  }
  if (!tokens.refresh_token) {
    // Google only returns a refresh token on first consent (or with
    // prompt=consent). Send the user back through consent.
    return NextResponse.redirect(`${base}/?google=norefresh`)
  }

  const res = NextResponse.redirect(`${base}/?google=connected`)
  res.cookies.set(GOOGLE_COOKIE, tokens.refresh_token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
    secure: process.env.NODE_ENV === 'production',
  })
  res.cookies.delete(GOOGLE_STATE_COOKIE)
  return res
}
