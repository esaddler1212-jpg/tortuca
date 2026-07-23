import { NextResponse } from 'next/server'
import { listPosts, createPost, type NewPost } from '@/lib/store'

export async function GET() {
  const posts = await listPosts()
  return NextResponse.json({ posts })
}

export async function POST(request: Request) {
  let body: Partial<NewPost>
  try {
    body = (await request.json()) as Partial<NewPost>
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.title || !body.excerpt || !body.content) {
    return NextResponse.json(
      { error: 'title, excerpt and content are required.' },
      { status: 400 },
    )
  }

  try {
    const post = await createPost({
      title: body.title,
      excerpt: body.excerpt,
      content: body.content,
      author: body.author,
      published: body.published,
    })
    return NextResponse.json({ post }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
