import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@ecs/shared/server'

interface ContactBody {
  name?: string
  email?: string
  company?: string
  message?: string
}

export async function POST(request: Request) {
  let body: ContactBody
  try {
    body = (await request.json()) as ContactBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, email, company, message } = body
  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Name, email and message are required.' },
      { status: 400 },
    )
  }

  const supabase = getAdminSupabase()

  // Graceful degradation: without Supabase we just log and accept the message
  // so the contact flow is testable in local development.
  if (!supabase) {
    console.info('[contact] (unstored)', { name, email, company })
    return NextResponse.json({ ok: true, stored: false })
  }

  const { error } = await supabase.from('contact_submissions').insert({
    name,
    email,
    company: company || null,
    message,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, stored: true })
}
