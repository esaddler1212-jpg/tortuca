import 'server-only'
import { getAdminSupabase } from '@ecs/shared/server'
import { SAMPLE_POSTS } from '@ecs/shared'

export interface AdminPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  published: boolean
  published_at: string
  cover_image: string | null
  tags: string[] | null
}

export interface Submission {
  id: string
  name: string
  email: string
  company: string | null
  message: string
  created_at: string
}

export interface Order {
  id: string
  customer_email: string
  total: number
  currency: string
  status: string
  created_at: string
}

export interface NewPost {
  title: string
  excerpt: string
  content: string
  author?: string
  published?: boolean
}

// ---------------------------------------------------------------------------
// In-memory fallback store (used when Supabase is not configured). This keeps
// the admin dashboard fully functional in local development. Data resets when
// the dev server restarts.
// ---------------------------------------------------------------------------
const memoryPosts: AdminPost[] = SAMPLE_POSTS.map((p) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  content: p.content,
  author: p.author,
  published: true,
  published_at: p.publishedAt,
  cover_image: p.coverImage ?? null,
  tags: p.tags ?? null,
}))

const memorySubmissions: Submission[] = [
  {
    id: 'seed-sub-1',
    name: 'Jordan Ellis',
    email: 'jordan@studio.example',
    company: 'Studio Ellis',
    message: 'Interested in a wholesale collaboration for FW26.',
    created_at: '2026-07-10T09:30:00.000Z',
  },
]

const memoryOrders: Order[] = [
  {
    id: 'ESC-1042',
    customer_email: 'ava@example.com',
    total: 175,
    currency: 'USD',
    status: 'fulfilled',
    created_at: '2026-07-12T14:05:00.000Z',
  },
  {
    id: 'ESC-1043',
    customer_email: 'liam@example.com',
    total: 95,
    currency: 'USD',
    status: 'processing',
    created_at: '2026-07-18T18:22:00.000Z',
  },
]

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function isBackendConfigured(): boolean {
  return getAdminSupabase() !== null
}

export async function listPosts(): Promise<AdminPost[]> {
  const supabase = getAdminSupabase()
  if (!supabase) {
    return [...memoryPosts].sort((a, b) =>
      b.published_at.localeCompare(a.published_at),
    )
  }
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('published_at', { ascending: false })
  if (error || !data) return []
  return data as AdminPost[]
}

export async function createPost(input: NewPost): Promise<AdminPost> {
  const now = new Date().toISOString()
  const post: AdminPost = {
    id: crypto.randomUUID(),
    slug: slugify(input.title) || crypto.randomUUID(),
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    author: input.author?.trim() || 'ECS Editorial',
    published: input.published ?? true,
    published_at: now,
    cover_image: null,
    tags: null,
  }

  const supabase = getAdminSupabase()
  if (!supabase) {
    memoryPosts.unshift(post)
    return post
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      published: post.published,
      published_at: post.published_at,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as AdminPost
}

export async function listSubmissions(): Promise<Submission[]> {
  const supabase = getAdminSupabase()
  if (!supabase) {
    return [...memorySubmissions].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    )
  }
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as Submission[]
}

export async function listOrders(): Promise<Order[]> {
  const supabase = getAdminSupabase()
  if (!supabase) {
    return [...memoryOrders].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    )
  }
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as Order[]
}
