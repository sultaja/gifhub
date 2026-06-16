import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Eye, Heart, Tag, ChevronRight } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getGifBySlug, getGifBySlugRaw, getAllGifSlugs, getRelatedGifs } from '@/lib/data'
import { GifGrid } from '@/components/gif-grid'
import { ViewTracker } from '@/components/view-tracker'
import { Link } from '@/i18n/navigation'
import { GifActions } from './gif-actions'
import { EmbedCode } from '@/components/embed-code'
import { FavoriteButton } from '@/components/favorite-button'
import { AddToCollection } from '@/components/add-to-collection'
import { BusinessShare } from '@/components/business-share'
import { GifInfoPanel } from '@/components/gif-info-panel'
import { RecentlyViewedTracker } from '@/components/recently-viewed-tracker'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gifhub.app'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllGifSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const gif = await getGifBySlug(slug)
  if (!gif) return { title: 'GIF Not Found' }

  const url = `${BASE_URL}/gif/${slug}`
  const pageTitle = gif.title.toLowerCase().includes('gif')
    ? `${gif.title} | GifHub`
    : `${gif.title} GIF | GifHub`
  const description = gif.altText || `Download and share ${gif.title} for free on GifHub.App`

  return {
    title: pageTitle,
    description,
    keywords: gif.tags,
    alternates: { canonical: url },
    openGraph: {
      title: pageTitle, description, url,
      siteName: 'GifHub.App',
      images: [{ url: gif.url, alt: gif.altText, width: 480, height: 360 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle, description,
      images: [gif.url],
    },
  }
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default async function GifPage({ params }: Props) {
  const { slug } = await params

  const [gif, rawGif] = await Promise.all([
    getGifBySlug(slug),
    getGifBySlugRaw(slug),
  ])

  if (!gif) notFound()

  const related = await getRelatedGifs(gif.id, rawGif?.category_id ?? null, 8)
  const gifUrl = `${BASE_URL}/gif/${slug}`
  const isVideo = gif.url.endsWith('.mp4') || gif.url.endsWith('.webm')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': isVideo ? 'VideoObject' : 'ImageObject',
    name: gif.title,
    description: gif.altText,
    contentUrl: gif.url,
    thumbnailUrl: gif.url,
    url: gifUrl,
    author: { '@type': 'Organization', name: 'GifHub.App' },
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/ViewAction', userInteractionCount: gif.views },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: gif.likes },
    ],
    keywords: gif.tags.join(', '),
  }

  return (
    <>
      <Header />
      <ViewTracker gifId={gif.id} />
      <RecentlyViewedTracker gifId={gif.id} slug={gif.slug} title={gif.title} url={gif.url} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="mx-auto max-w-5xl px-4 py-8 pb-20 sm:px-6 md:py-12">
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <ChevronRight size={14} />
          {gif.categorySlug && (
            <>
              <Link href={`/category/${gif.categorySlug}`} className="capitalize transition-colors hover:text-foreground">
                {gif.categorySlug.replace(/-/g, ' ')}
              </Link>
              <ChevronRight size={14} />
            </>
          )}
          <span className="truncate text-foreground">{gif.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Visual */}
          <div className="flex flex-col gap-6">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-xl ring-1 ring-border/50">
              {isVideo ? (
                <video src={gif.url} autoPlay loop muted playsInline className="max-h-[70vh] w-full object-contain" />
              ) : (
                <div className="relative w-full" style={{ paddingBottom: '56.25%', maxHeight: '70vh' }}>
                  <Image
                    src={gif.url}
                    alt={gif.altText}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 700px"
                    unoptimized
                    priority
                  />
                </div>
              )}
            </div>

            {/* Title & Stats */}
            <div className="mt-5">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">{gif.title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{gif.altText}</p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Eye size={14} /> {formatCount(gif.views)} views
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart size={14} /> {formatCount(gif.likes)} likes
                </span>
                {gif.categorySlug && (
                  <Link
                    href={`/category/${gif.categorySlug}`}
                    className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium capitalize text-primary transition-colors hover:bg-primary/20"
                  >
                    {gif.categorySlug.replace(/-/g, ' ')}
                  </Link>
                )}
              </div>
            </div>

            {/* Tags */}
            {gif.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Tag size={13} className="shrink-0 text-muted-foreground" />
                {gif.tags.map((tag) => (
                  <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                    <span className="inline-block rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary dark:bg-muted/60">
                      #{tag}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Editorial Context (High Value Content) */}
            {(gif.usageScenario || gif.suggestedCaption || gif.professionalismScore !== undefined) && (
              <div className="mt-8 rounded-2xl border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold tracking-tight">How to use this GIF professionally</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {gif.usageScenario && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Best Scenario</h3>
                      <p className="text-sm leading-relaxed">{gif.usageScenario}</p>
                    </div>
                  )}
                  {gif.suggestedCaption && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Suggested Message</h3>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-sm font-medium italic">"{gif.suggestedCaption}"</p>
                      </div>
                    </div>
                  )}
                </div>
                {gif.professionalismScore !== undefined && gif.professionalismScore !== null && (
                  <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Professionalism Score:</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                        <div 
                          className={`h-full rounded-full ${gif.professionalismScore >= 8 ? 'bg-emerald-500' : gif.professionalismScore >= 5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${(gif.professionalismScore / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">{gif.professionalismScore}/10</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Actions (shown below GIF on small screens) */}
            <div className="mt-6 space-y-4 lg:hidden">
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <GifActions gifId={gif.id} url={gifUrl} gifSrc={gif.url} title={gif.title} />
                  <FavoriteButton gifId={gif.id} />
                  <AddToCollection gifId={gif.id} />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Share to Workspace</h3>
                <BusinessShare gifUrl={gif.url} pageUrl={gifUrl} title={gif.title} />
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">GIF Details</h3>
                <GifInfoPanel gifUrl={gif.url} title={gif.title} />
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Embed</h3>
                <EmbedCode gifUrl={gif.url} gifTitle={gif.title} pageUrl={gifUrl} />
              </div>
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden w-[340px] shrink-0 space-y-5 lg:block">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-4 text-sm font-semibold">Actions</h3>
              <div className="flex flex-wrap gap-2">
                <GifActions gifId={gif.id} url={gifUrl} gifSrc={gif.url} title={gif.title} />
                <FavoriteButton gifId={gif.id} />
                <AddToCollection gifId={gif.id} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Share to Workspace</h3>
              <BusinessShare gifUrl={gif.url} pageUrl={gifUrl} title={gif.title} />
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">GIF Details</h3>
              <GifInfoPanel gifUrl={gif.url} title={gif.title} />
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Embed</h3>
              <EmbedCode gifUrl={gif.url} gifTitle={gif.title} pageUrl={gifUrl} />
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-14">
            <GifGrid title="Related GIFs" gifs={related} columns={4} />
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
