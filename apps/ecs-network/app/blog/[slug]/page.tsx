import { notFound } from 'next/navigation'
import { formatDate } from '@ecs/shared'
import { getPost } from '@/lib/blog'

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  return (
    <article className="mx-auto max-w-2xl px-5 py-16">
      <a
        href="/blog"
        className="text-xs uppercase tracking-widest text-neutral-400 hover:text-black"
      >
        ← Journal
      </a>
      <p className="mt-6 text-xs uppercase tracking-widest text-neutral-400">
        {formatDate(post.publishedAt)} · {post.author}
      </p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">
        {post.title}
      </h1>
      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt={post.title}
          className="mt-8 aspect-[16/9] w-full object-cover"
        />
      )}
      <div className="mt-8 space-y-4 text-neutral-600">
        <p className="text-lg text-neutral-500">{post.excerpt}</p>
        <p>{post.content}</p>
      </div>
    </article>
  )
}
