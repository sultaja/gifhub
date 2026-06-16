import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BlogCard } from '@/components/blog-card'
import { BlogSidebar } from '@/components/blog-sidebar'
import { BlogSearch } from '@/components/blog-search'
import { BlogNewsletter } from '@/components/blog-newsletter'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { getBlogPosts, getBlogCategories, getBlogTags, getFeaturedPosts } from '@/lib/blog-data'
import { Link } from '@/i18n/navigation'
import { ChevronLeft, ChevronRight, BookOpen, Rss, Clock, ArrowRight, Newspaper } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog — GIF Tips, Business Communication & Workplace Culture',
  description: 'Expert articles on using GIFs for business communication, team productivity, marketing campaigns, and remote work. Tips, guides, and industry insights.',
  openGraph: {
    title: 'GifHub Blog — GIF Tips for Business Communication',
    description: 'Expert articles on using GIFs for business communication, marketing, and workplace culture.',
    type: 'website',
  },
  alternates: {
    canonical: '/blog',
    types: {
      'application/rss+xml': '/blog/feed.xml',
    },
  },
}

type Props = {
  searchParams: Promise<{ page?: string }>
}

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? 1))

  const [{ posts, total, totalPages }, categories, tags, featuredPosts] = await Promise.all([
    getBlogPosts({ page, limit: 9 }),
    getBlogCategories(),
    getBlogTags(),
    page === 1 ? getFeaturedPosts(1) : Promise.resolve([]),
  ])

  const featured = featuredPosts[0] ?? null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'GifHub Blog',
    description: 'Expert articles on using GIFs for business communication.',
    url: 'https://gifhub.app/blog',
    publisher: {
      '@type': 'Organization',
      name: 'GifHub',
      url: 'https://gifhub.app',
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <Breadcrumbs items={[{ label: 'Blog' }]} />

        {/* Hero */}
        <div className="relative mt-8 mb-16 overflow-hidden rounded-3xl border border-border/50 bg-card p-8 sm:p-12 shadow-2xl dark:shadow-none dark:glow-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
          <div className="absolute -right-20 -top-20 h-[300px] w-[300px] animate-pulse-ring rounded-full bg-primary/20 blur-[80px]" />
          
          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg glow-sm">
                  <Newspaper size={20} className="text-primary-foreground" />
                </div>
                <span className="rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary glass">
                  {total} article{total !== 1 ? 's' : ''}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                GifHub <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Blog</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Expert insights, deep dives, and practical guides on using GIFs for business communication, marketing campaigns, and remote team culture.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/blog/feed.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
                title="RSS Feed"
              >
                <Rss size={15} className="text-orange-500" />
                RSS
              </a>
            </div>
          </div>

          <div className="mt-6 max-w-md">
            <BlogSearch />
          </div>
        </div>

        {/* Featured Post Hero */}
        {featured && page === 1 && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group relative mb-16 block overflow-hidden rounded-[2rem] border border-border/50 bg-card/50 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl dark:hover:glow-card"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent z-10 md:bg-gradient-to-r md:from-background md:via-background/80 md:to-transparent" />
            {featured.featured_image && (
              <div className="absolute inset-0 w-full h-full md:left-1/3 md:w-2/3">
                <img
                  src={featured.featured_image}
                  alt={featured.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            )}
            
            <div className="relative z-20 flex min-h-[400px] flex-col justify-center p-8 md:w-[60%] md:p-14 lg:p-16">
              {featured.categories.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg glow-sm">
                    Featured
                  </span>
                  {featured.categories.map((cat) => (
                    <span key={cat.id} className="rounded-full border border-border/50 bg-background/50 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-foreground">
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
              <h2 className="text-3xl font-extrabold leading-[1.15] text-foreground transition-colors duration-300 group-hover:text-primary md:text-4xl lg:text-5xl">
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground/90 line-clamp-3 max-w-2xl">
                  {featured.excerpt}
                </p>
              )}
              <div className="mt-8 flex items-center gap-5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {featured.author.charAt(0)}
                  </div>
                  <span className="font-semibold text-foreground">{featured.author}</span>
                </div>
                <span className="flex items-center gap-1.5 opacity-80">
                  <Clock size={14} />
                  {featured.reading_time} min read
                </span>
                <span className="ml-auto flex items-center gap-1.5 font-bold text-primary opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  Read article
                  <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </Link>
        )}

        <div className="flex flex-col gap-12 lg:flex-row">
          {/* Main Content */}
          <div className="min-w-0 flex-1">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center">
                <BookOpen size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-semibold text-muted-foreground">No posts yet</p>
                <p className="mt-1 text-sm text-muted-foreground/70">Check back soon for fresh content!</p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>

                {page === 1 && <BlogNewsletter />}

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Blog pagination">
                    {page > 1 && (
                      <Link
                        href={`/blog?page=${page - 1}`}
                        className="flex items-center gap-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ChevronLeft size={14} />
                        Previous
                      </Link>
                    )}

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, i, arr) => {
                        const showEllipsis = i > 0 && p - arr[i - 1] > 1
                        return (
                          <span key={p} className="flex items-center">
                            {showEllipsis && <span className="px-2 text-muted-foreground/50">...</span>}
                            <Link
                              href={`/blog?page=${p}`}
                              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                p === page
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}
                            >
                              {p}
                            </Link>
                          </span>
                        )
                      })}

                    {page < totalPages && (
                      <Link
                        href={`/blog?page=${page + 1}`}
                        className="flex items-center gap-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        Next
                        <ChevronRight size={14} />
                      </Link>
                    )}
                  </nav>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-80">
            <div className="space-y-6 lg:sticky lg:top-20">
              <BlogSidebar categories={categories} tags={tags} />
              <div className="rounded-xl border border-border bg-card p-4">
                <a
                  href="/blog/feed.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  <Rss size={15} className="text-orange-500" />
                  Subscribe via RSS Feed
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
