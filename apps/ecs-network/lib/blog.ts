import { getAdminSupabase } from '@ecs/shared/server'
import { SAMPLE_POSTS, type BlogPost } from '@ecs/shared'

interface PostRow {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  cover_image: string | null
  author: string
  published_at: string
  tags: string[] | null
}

function mapRow(row: PostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.cover_image ?? undefined,
    author: row.author,
    publishedAt: row.published_at,
    tags: row.tags ?? undefined,
  }
}

/** Reads published posts from Supabase, falling back to bundled samples. */
export async function getPosts(): Promise<BlogPost[]> {
  const supabase = getAdminSupabase()
  if (!supabase) return SAMPLE_POSTS

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })

  if (error || !data || data.length === 0) return SAMPLE_POSTS
  return (data as PostRow[]).map(mapRow)
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  const posts = await getPosts()
  return posts.find((p) => p.slug === slug)
}
