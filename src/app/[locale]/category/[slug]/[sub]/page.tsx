import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Sidebar } from '@/components/sidebar'
import { MobileSidebar } from '@/components/mobile-sidebar'
import { GifGrid } from '@/components/gif-grid'
import fs from 'fs'
import path from 'path'
import {
  getCategoryBySlug,
  getSubcategoryBySlug,
  getCategories,
  getGifsBySubcategory,
} from '@/lib/data'
import { Link } from '@/i18n/navigation'
import { ChevronRight } from 'lucide-react'

type Props = {
  params: Promise<{ locale: string; slug: string; sub: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, sub } = await params
  const category = await getCategoryBySlug(slug)
  const subcategory = await getSubcategoryBySlug(sub)
  if (!category || !subcategory) return { title: 'Not Found' }

  return {
    title: `${subcategory.name} — ${category.name} GIFs`,
    description: `Browse ${subcategory.name} GIFs in the ${category.name} category on GifHub.App`,
  }
}

export default async function SubcategoryPage({ params }: Props) {
  const { slug, sub } = await params
  const category = await getCategoryBySlug(slug)
  const subcategory = await getSubcategoryBySlug(sub)
  if (!category || !subcategory) notFound()

  const [categories, gifs] = await Promise.all([
    getCategories(),
    getGifsBySubcategory(subcategory.id),
  ])

  let seoDescription = null
  try {
    const dataPath = path.join(process.cwd(), 'src', 'data', 'subcategory-seo.json')
    if (fs.existsSync(dataPath)) {
      const seoData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
      if (seoData[sub]) {
        seoDescription = seoData[sub]
      }
    }
  } catch (e) {
    console.error('Failed to load subcategory SEO data:', e)
  }

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
            <Link href={`/category/${slug}`} className="transition-colors hover:text-foreground">{category.name}</Link>
            <ChevronRight size={12} />
            <span className="font-medium text-foreground">{subcategory.name}</span>
          </nav>

          <div className="mb-4 lg:hidden">
            <MobileSidebar categories={categories} />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{subcategory.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{category.name}</p>
          </div>

          {gifs.length > 0 ? (
            <GifGrid title="GIFs" gifs={gifs} columns={4} />
          ) : (
            <div className="flex flex-col items-center py-20">
              <p className="text-lg font-medium">No GIFs yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Check back soon!</p>
            </div>
          )}

          {/* High-Value SEO / Editorial Context Block */}
          {seoDescription && (
            <div className="mt-20 rounded-[2rem] border border-border/50 bg-card/40 p-8 md:p-14 shadow-xl backdrop-blur-md dark:glow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
                <span className="text-[15rem] leading-none font-bold">"</span>
              </div>
              <div 
                className="prose-editorial max-w-none relative z-10" 
                dangerouslySetInnerHTML={{ __html: seoDescription }} 
              />
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  )
}
