import { BlogCard, isSupabaseConfigured } from '@ecs/shared'
import { getPosts } from '@/lib/blog'

export const metadata = {
  title: 'Journal — ECS Network',
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="mb-10 flex items-end justify-between">
        <h1 className="text-2xl font-semibold uppercase tracking-wide">
          Journal
        </h1>
        {!isSupabaseConfigured() && (
          <span className="text-xs uppercase tracking-widest text-neutral-400">
            Sample content
          </span>
        )}
      </div>
      <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
