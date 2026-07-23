import { NextResponse } from 'next/server'
import { listTrackers, createTracker } from '@/lib/store'

export async function GET() {
  const trackers = await listTrackers()
  return NextResponse.json({ trackers })
}

export async function POST(request: Request) {
  let body: { label?: string; unit?: string; category?: string }
  try {
    body = (await request.json()) as {
      label?: string
      unit?: string
      category?: string
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!body.label || !body.label.trim()) {
    return NextResponse.json({ error: 'label is required' }, { status: 400 })
  }
  const tracker = await createTracker(body.label.trim(), body.unit, body.category)
  return NextResponse.json({ tracker }, { status: 201 })
}
