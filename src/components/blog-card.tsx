import { Link } from '@/i18n/navigation'
import { Clock, ArrowRight } from 'lucide-react'
import type { BlogPost } from '@/lib/blog-data'

interface BlogCardProps {
  post: BlogPost
}

export function BlogCard({ post }: BlogCardProps) {
  const publishDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : null

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:border-primary/30 hover:shadow-xl dark:hover:glow-card">
      {post.featured_image && (
        <Link href={`/blog/${post.slug}`} className="relative aspect-[16/9] overflow-hidden">
          <img
            src={post.featured_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
        </Link>
      )}

      <div className="flex flex-1 flex-col p-6">
        {post.categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {post.categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/blog/category/${cat.slug}`}
                className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/20"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        <Link href={`/blog/${post.slug}`} className="group/title">
          <h2 className="mb-3 text-xl font-bold leading-tight text-foreground transition-colors duration-300 group-hover/title:text-primary">
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wide">
            {publishDate && <time dateTime={post.published_at!}>{publishDate}</time>}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {post.reading_time} min
            </span>
          </div>

          <Link
            href={`/blog/${post.slug}`}
            className="flex items-center gap-1.5 text-[13px] font-bold text-primary transition-all duration-300 hover:text-primary/80 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0"
          >
            Read
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  )
}
