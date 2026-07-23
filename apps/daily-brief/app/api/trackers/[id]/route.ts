import { NextResponse } from 'next/server'
import { adjustTracker } from '@/lib/store'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  let body: { delta?: number }
  try {
    body = (await request.json()) as { delta?: number }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const delta = typeof body.delta === 'number' ? body.delta : 0
  const tracker = await adjustTracker(params.id, delta)
  if (!tracker) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ tracker })
}
