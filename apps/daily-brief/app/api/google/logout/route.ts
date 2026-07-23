import { NextResponse } from 'next/server'
import { GOOGLE_COOKIE } from '@/lib/google'

export async function GET(request: Request) {
  const base = new URL(request.url).origin
  const res = NextResponse.redirect(`${base}/?google=disconnected`)
  res.cookies.delete(GOOGLE_COOKIE)
  return res
}
