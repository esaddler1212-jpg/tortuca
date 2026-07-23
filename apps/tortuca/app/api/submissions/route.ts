import { NextResponse } from 'next/server'
import { listSubmissions } from '@/lib/store'

export async function GET() {
  const submissions = await listSubmissions()
  return NextResponse.json({ submissions })
}
