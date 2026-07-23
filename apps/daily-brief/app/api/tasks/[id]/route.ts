import { NextResponse } from 'next/server'
import { setTaskDone } from '@/lib/store'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  let body: { done?: boolean }
  try {
    body = (await request.json()) as { done?: boolean }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (typeof body.done !== 'boolean') {
    return NextResponse.json({ error: 'done (boolean) is required' }, { status: 400 })
  }
  const task = await setTaskDone(params.id, body.done)
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ task })
}
