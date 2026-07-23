import type { BlogPost } from '../types'
import { formatDate } from '../utils/format'

interface BlogCardProps {
  post: BlogPost
  href?: string
}

export function BlogCard({ post, href }: BlogCardProps) {
  const target = href ?? `/blog/${post.slug}`
  return (
    <article className="group flex flex-col">
      <a href={target} className="block">
        <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-100">
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : null}
        </div>
        <div className="mt-4">
          <p className="text-xs uppercase tracking-widest text-neutral-400">
            {formatDate(post.publishedAt)} · {post.author}
          </p>
          <h3 className="mt-2 text-lg font-medium leading-snug group-hover:underline">
            {post.title}
          </h3>
          <p className="mt-2 text-sm text-neutral-500">{post.excerpt}</p>
        </div>
      </a>
    </article>
  )
}
