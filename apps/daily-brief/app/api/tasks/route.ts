import { NextResponse } from 'next/server'
import { listTasks, createTask } from '@/lib/store'

export async function GET() {
  const tasks = await listTasks()
  return NextResponse.json({ tasks })
}

export async function POST(request: Request) {
  let body: { title?: string; dueAt?: string }
  try {
    body = (await request.json()) as { title?: string; dueAt?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!body.title || !body.title.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }
  const task = await createTask(body.title.trim(), body.dueAt)
  return NextResponse.json({ task }, { status: 201 })
}
