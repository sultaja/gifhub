import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Sidebar } from '@/components/sidebar'
import { MobileSidebar } from '@/components/mobile-sidebar'
import { LoadMoreGrid } from '@/components/load-more-grid'
import { CategoryHero } from '@/components/category-hero'
import { getCategoryBySlug, getCategories, getGifsByCategory, getGifCount } from '@/lib/data'
import { Link } from '@/i18n/navigation'
import { ChevronRight } from 'lucide-react'
import type { CategoryWithSubs } from '@/lib/types'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: 'Category Not Found' }

  return {
    title: `${category.name} GIFs — Professional ${category.name} GIFs for Business | GifHub`,
    description: category.description ?? `Browse professional ${category.name} GIFs on GifHub.App — curated for workplace communication and business presentations.`,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const [categories, gifs, totalCount] = await Promise.all([
    getCategories(),
    getGifsByCategory(category.id, 16),
    getGifCount(category.id),
  ])

  const thisCat = categories.find((c: CategoryWithSubs) => c.id === category.id)
  const subcategories = thisCat?.subcategories ?? []
  const hasMore = totalCount > 16

  return (
    <>
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6 pb-20 sm:px-6 sm:pb-6">
        <div className="hidden lg:block">
          <Sidebar categories={categories} />
        </div>
        <main className="min-w-0 flex-1">
          <nav className="mb-5 flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
            <ChevronRight size={12} />
            <span className="font-medium text-foreground">{category.name}</span>
          </nav>

          <div className="mb-4 lg:hidden">
            <MobileSidebar categories={categories} />
          </div>

          <CategoryHero
            name={category.name}
            slug={slug}
            description={`Browse our curated collection of professional ${category.name} GIFs, perfectly suited for modern workplace communication.`}
            gifCount={totalCount}
          />

          {subcategories.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <Link
                href={`/category/${slug}`}
                className="rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary"
              >
                All
              </Link>
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/category/${slug}/${sub.slug}`}
                  className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}

          {gifs.length > 0 ? (
            <LoadMoreGrid
              title={`${category.name} GIFs`}
              initialGifs={gifs}
              sort="latest"
              categoryId={category.id}
              initialHasMore={hasMore}
            />
          ) : (
            <div className="flex flex-col items-center py-20">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <span className="text-3xl">📂</span>
              </div>
              <p className="text-lg font-medium">No GIFs yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Content is being curated for this category.</p>
            </div>
          )}

          {/* High-Value SEO / Editorial Context Block */}
          {category.description ? (
            <div className="mt-20 rounded-[2rem] border border-border/50 bg-card/40 p-8 md:p-14 shadow-xl backdrop-blur-md dark:glow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
                <span className="text-[15rem] leading-none font-bold">"</span>
              </div>
              <div 
                className="prose-editorial max-w-none relative z-10" 
                dangerouslySetInnerHTML={{ __html: category.description }} 
              />
            </div>
          ) : (
            <div className="mt-16 rounded-2xl border border-border bg-card/50 p-6 md:p-8">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">The Ultimate Guide to {category.name} Communication</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Effective communication in <strong>{category.name}</strong> relies heavily on tone, timing, and visual context. 
                  Whether you're communicating with your team on Slack, presenting to stakeholders, or sending a follow-up email, 
                  the right GIF can break the ice, show empathy, and reinforce team culture.
                </p>
                <h3 className="text-lg font-semibold mt-6 mb-2">When to use these GIFs</h3>
                <p>
                  We recommend using these visuals to celebrate milestones, soften the blow of difficult news, 
                  or simply bring a moment of levity to a busy workday. Remember to always gauge your audience's 
                  professional boundaries before sending a reaction GIF.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  )
}
